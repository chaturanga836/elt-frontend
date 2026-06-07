'use client';

import { Alert, Typography } from 'antd';
import type { ParsedScriptError } from '@/lib/pipelineDebugError';

const { Text, Paragraph } = Typography;

type Props = {
  error: ParsedScriptError;
};

export default function PipelineDebugScriptError({ error }: Props) {
  return (
    <Alert
      type="error"
      showIcon
      title={error.summary}
      style={{ marginBottom: 12 }}
      description={
        <div>
          {error.lineNumber != null ? (
            <Paragraph style={{ marginBottom: 8 }}>
              <Text strong>Line {error.lineNumber}</Text>
              {error.lineHint ? (
                <Text code style={{ display: 'block', marginTop: 4, whiteSpace: 'pre-wrap' }}>
                  {error.lineHint}
                </Text>
              ) : null}
            </Paragraph>
          ) : null}
          {error.exceptionType ? (
            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
              {error.exceptionType}
              {error.message ? `: ${error.message}` : ''}
            </Text>
          ) : null}
          <Text type="secondary" style={{ fontSize: 11 }}>
            Full traceback
          </Text>
          <pre
            style={{
              marginTop: 4,
              marginBottom: 0,
              padding: 8,
              background: '#fff2f0',
              borderRadius: 4,
              fontSize: 11,
              maxHeight: 160,
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
            }}
          >
            {error.traceback}
          </pre>
        </div>
      }
    />
  );
}
