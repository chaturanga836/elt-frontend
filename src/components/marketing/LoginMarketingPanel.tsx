'use client';

import { Typography } from 'antd';
import {
  ApiOutlined,
  CloudServerOutlined,
  NodeIndexOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import AppBrand from '@/components/brand/AppBrand';
import { BRAND_TAGLINE } from '@/constants/brand';
import styles from '@/app/login/login.module.css';

const { Title, Paragraph, Text } = Typography;

const FEATURES = [
  {
    icon: <NodeIndexOutlined className={styles.featureIcon} />,
    title: 'Pipelines & workflows',
    description: 'Visual orchestration for ELT jobs and multi-step automation.',
  },
  {
    icon: <ApiOutlined className={styles.featureIcon} />,
    title: 'Unified connections',
    description: 'REST, databases, storage, and plugins in one workspace catalog.',
  },
  {
    icon: <RobotOutlined className={styles.featureIcon} />,
    title: 'AI-ready agents',
    description: 'Optional LLM settings per workspace for research and reports.',
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
  'Celery workers',
  'Report engine',
] as const;

export default function LoginMarketingPanel() {
  return (
    <section className={styles.marketing}>
      <div className={styles.marketingInner}>
        <AppBrand variant="marketing" showTagline={false} />

        <Title level={1} className={styles.heroTitle}>
          Run your data platform on your terms
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
        <Text style={{ color: 'inherit' }}>
          Deploy on your EC2 or Docker stack — you own the data and the keys.
        </Text>
      </div>
    </section>
  );
}
