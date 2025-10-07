import { useEffect, useMemo, useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Avatar,
  Tag,
  Skeleton,
  message,
  Space,
  Select,
  Divider,
} from "antd";
import AvatarUpload from "../../components/AvatarUpload";
import { authedFetch } from "../../lib/utils";
import { startCheckout } from "../../lib/checkout";

export default function WorkerProfile() {
  const [form] = Form.useForm();
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [buying, setBuying] = useState(false);

  // Prefer canonical server field; keep fallbacks for safety
  const boostUntilISO =
    me?.profileBoostUntil ||
    me?.profileBoostExpiresAt ||
    me?.boost?.workerProfile?.expiresAt ||
    me?.boost?.worker?.expiresAt ||
    null;

  const boostActive = useMemo(() => {
    if (!boostUntilISO) return false;
    const t = new Date(boostUntilISO).getTime();
    return Number.isFinite(t) && t > Date.now();
  }, [boostUntilISO]);

  const boostLabel = boostActive
    ? `Active until ${new Date(boostUntilISO).toLocaleString()}`
    : "Not active";

  useEffect(() => {
    (async () => {
      try {
        const data = await authedFetch("/api/auth/me");
        const u = data.user || null;
        setMe(u);
        form.setFieldsValue({
          name: u?.name || "",
          city: u?.city || "",
          about: u?.about || "",
          skills: u?.skills || [],
          avatarUrl: u?.avatarUrl || "",
          email: u?.email || "",
        });
      } catch (e) {
        console.error(e);
        message.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, [form]);

  async function onSave(values) {
    setSaving(true);
    try {
      // don't patch email
      const payload  = { ...values};
      await authedFetch("/api/users", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      message.success("Profile updated");
      setMe((m) => (m ? { ...m, ...payload } : m));
    } catch (e) {
      message.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function buyProfileBoost() {
    try {
      setBuying(true);
      // IMPORTANT: productType must match your server enum
      const result = await startCheckout({ productType: "PROFILE_BOOST_7D" });
      if (result?.ok) {
        const data = await authedFetch("/api/auth/me");
        setMe(data.user || null);
        message.success("Profile Boost activated 🎉");
      } else {
        message.info("Checkout closed.");
      }
    } catch (e) {
      message.error(e.message || "Payment failed");
    } finally {
      setBuying(false);
    }
  }

  const header = (
    <div className="flex items-center gap-4">
      <Avatar size={64} src={me?.avatarUrl}>
        {me?.name?.[0]?.toUpperCase()}
      </Avatar>

      <div className="min-w-0">
        <div className="font-semibold truncate">{me?.name || "Worker"}</div>
        <div className="text-xs text-gray-500 truncate">{me?.email}</div>
        <Space size="small" wrap className="mt-1">
          <Tag color="purple">Worker</Tag>
          {me?.isVerified ? <Tag color="green">Verified</Tag> : <Tag>Unverified</Tag>}
          {boostActive && <Tag color="gold">Boosted</Tag>}
        </Space>
      </div>

      <div className="ml-auto">
        <AvatarUpload
          buttonText="Change photo"
          onChange={async (url) => {
            form.setFieldsValue({ avatarUrl: url });
            setMe((m) => (m ? { ...m, avatarUrl: url } : m));
            try {
              await authedFetch("/api/users", {
                method: "PATCH",
                body: JSON.stringify({ avatarUrl: url }),
              });
              message.success("Avatar updated");
            } catch {
              message.error("Could not save avatar");
            }
          }}
        />
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <Card title="Worker Profile" className="mb-3" />
      <Card>
        {loading ? (
          <Skeleton active paragraph={{ rows: 7 }} />
        ) : (
          <>
            {header}

            {/* Boost section */}
            <Divider className="!my-4" />
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <div>
                <div className="font-medium">Profile Boost</div>
                <div className="text-xs text-gray-500">{boostLabel}</div>
              </div>
              <div className="flex gap-2">
                <Button type="primary" loading={buying} onClick={buyProfileBoost}>
                  {boostActive ? "Extend 7 days — ₹99" : "Boost profile (7 days) — ₹99"}
                </Button>
              </div>
            </div>

            <Divider className="!my-4" />

            {/* Edit form */}
            <Form
              form={form}
              layout="vertical"
              onFinish={onSave}
              initialValues={{ name: "", city: "", about: "", skills: [], avatarUrl: "" }}
            >
              <Form.Item name="email" label="Email">
                <Input disabled />
              </Form.Item>

              <Form.Item
                name="name"
                label="Full name"
                rules={[{ required: true, message: "Please enter your full name" }]}
              >
                <Input placeholder="Your name" />
              </Form.Item>

              <Form.Item name="city" label="City">
                <Input placeholder="Your city (e.g., Pune)" />
              </Form.Item>

              <Form.Item name="about" label="About">
                <Input.TextArea
                  placeholder="Brief intro, strengths, and availability…"
                  rows={4}
                />
              </Form.Item>

              <Form.Item
                name="skills"
                label="Skills"
                tooltip="Type a skill and press Enter. Paste a comma-separated list too."
              >
                <Select
                  mode="tags"
                  tokenSeparators={[","]}
                  placeholder="e.g., House Cleaning, Web Development, Photography"
                  open={false}
                />
              </Form.Item>

              <div className="flex gap-2">
                <Button type="primary" htmlType="submit" loading={saving}>
                  Save changes
                </Button>
                <Button onClick={() => form.resetFields()}>Reset</Button>
              </div>
            </Form>
          </>
        )}
      </Card>
    </div>
  );
}