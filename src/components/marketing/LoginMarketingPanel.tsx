'use client';

import { Typography } from 'antd';
import {
  ApiOutlined,
  CloudServerOutlined,
  DatabaseOutlined,
  NodeIndexOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { BRAND_TAGLINE } from '@/constants/brand';
import styles from '@/app/login/login.module.css';

const { Title, Paragraph, Text } = Typography;

const FEATURES = [
  {
    icon: <NodeIndexOutlined className={styles.featureIcon} />,
    title: 'Workflows',
    description: 'Visual multi-step automation for pipelines and jobs.',
  },
  {
    icon: <ApiOutlined className={styles.featureIcon} />,
    title: 'Unified connections',
    description: 'REST APIs, databases, storage, and Git connections in one catalog.',
  },
  {
    icon: <DatabaseOutlined className={styles.featureIcon} />,
    title: 'Provisioned databases',
    description: 'Spin up Postgres per workspace without manual DevOps.',
  },
  {
    icon: <SafetyCertificateOutlined className={styles.featureIcon} />,
    title: 'Enterprise auth',
    description: 'Keycloak-backed sign-in with workspace roles and access control.',
  },
] as const;

const PILLS = [
  'Self-hosted',
  'Multi-tenant',
  'Automation',
  'Realtime',
  'Databases',
] as const;

export default function LoginMarketingPanel() {
  return (
    <section className={styles.marketing}>
      <div className={styles.marketingInner}>
        <Title level={1} className={styles.heroTitle}>
          Your full backend stack, one click away
        </Title>
        <Paragraph className={styles.heroLead}>{BRAND_TAGLINE}</Paragraph>

        <div className={styles.featureGrid}>
          {FEATURES.map((f) => (
            <div key={f.title} className={styles.featureCard}>
              {f.icon}
              <Paragraph className={styles.featureTitle}>{f.title}</Paragraph>
              <Paragraph className={styles.featureDesc}>{f.description}</Paragraph>
            </div>
          ))}
        </div>

        <div className={styles.pillRow}>
          {PILLS.map((label) => (
            <span key={label} className={styles.pill}>
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.footerNote}>
        <TeamOutlined style={{ marginRight: 6 }} />
        <CloudServerOutlined style={{ marginRight: 6, marginLeft: 12 }} />
        <Text type="secondary">
          Deploy on your EC2 or Docker stack — you own the infrastructure, data, and keys.
        </Text>
      </div>
    </section>
  );
}
