import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,
  async redirects() {
    return [
      { source: '/workspaces', destination: '/projects', permanent: false },
      { source: '/workspaces/new', destination: '/projects/new', permanent: false },
      {
        source: '/workspaces/:id',
        destination: '/projects/:id',
        permanent: false,
      },
      {
        source: '/workspaces/:id/:path*',
        destination: '/projects/:id/:path*',
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/projects/:id/workflow',
        destination: '/workspaces/:id/pipe',
      },
      {
        source: '/projects/:id/workflow/:path*',
        destination: '/workspaces/:id/pipe/:path*',
      },
      {
        source: '/projects/:id/api/rest/groups/:path*',
        destination: '/workspaces/:id/connections/rest-api/groups/:path*',
      },
      {
        source: '/projects/:id/api/rest/groups',
        destination: '/workspaces/:id/connections/rest-api/groups',
      },
      {
        source: '/projects/:id/api/rest',
        destination: '/workspaces/:id/connections',
      },
      {
        source: '/projects/:id/services/github',
        destination: '/workspaces/:id/services/github',
      },
      {
        source: '/projects/:id/services/:path*',
        destination: '/workspaces/:id/task/:path*',
      },
      {
        source: '/projects/:id/services',
        destination: '/workspaces/:id/task',
      },
      {
        source: '/projects/:id/:path*',
        destination: '/workspaces/:id/:path*',
      },
      {
        source: '/projects/:id',
        destination: '/workspaces/:id',
      },
      {
        source: '/projects/new',
        destination: '/workspaces/new',
      },
      {
        source: '/projects/settings',
        destination: '/workspaces/settings',
      },
      {
        source: '/projects',
        destination: '/workspaces',
      },
    ];
  },
};

export default nextConfig;
