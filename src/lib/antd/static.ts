// src/lib/antd/static.ts
'use client';
import { App } from 'antd';
import type { MessageInstance } from 'antd/es/message/interface';
import type { NotificationInstance } from 'antd/es/notification/interface';

let message: MessageInstance;
let notification: NotificationInstance;

// This component will capture the static instances from the AntD <App />
export default function StaticHandler() {
  const staticApp = App.useApp();
  message = staticApp.message;
  notification = staticApp.notification;
  return null;
}

export { message, notification };