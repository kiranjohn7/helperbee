// client/src/pages/profile/HirerProfile.jsx
import { useEffect, useState } from "react";
import { Card, Form, Input, Button, Avatar, Tag, Skeleton, message, Space } from "antd";
import AvatarUpload from "../../components/AvatarUpload";
import { authedFetch } from "../../lib/utils";

export default function HirerProfile() {
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
        <div className="font-semibold truncate">{me?.name || "Hirer"}</div>
        <div className="text-xs text-gray-500 truncate">{me?.email}</div>
        <Space size="small" wrap className="mt-1">
          <Tag color="geekblue">Hirer</Tag>
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
      <Card title="Hirer Profile" className="mb-3" />
      <Card>
        {loading ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : (
          <>
            {header}
            <div className="h-4" />
            <Form
              form={form}
              layout="vertical"
              onFinish={onSave}
              initialValues={{ name: "", city: "", about: "", avatarUrl: "" }}
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
                <Input placeholder="Your city (e.g., Bengaluru)" />
              </Form.Item>

              <Form.Item name="about" label="About">
                <Input.TextArea
                  placeholder="Tell workers what you hire for and expectations…"
                  rows={4}
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