// client/src/pages/profile/WorkerProfile.jsx
import { useEffect, useState } from "react";
import { Card, Form, Input, Button, Avatar, Tag, Skeleton, message, Space, Select } from "antd";
import AvatarUpload from "../../components/AvatarUpload";
import { authedFetch } from "../../lib/utils";

export default function WorkerProfile() {
  const [form] = Form.useForm();
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      const payload = { ...values };
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
            <div className="h-4" />
            <Form
              form={form}
              layout="vertical"
              onFinish={onSave}
              initialValues={{ name: "", city: "", about: "", skills: [], avatarUrl: "" }}
            >
              {/* Email (read-only) */}
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