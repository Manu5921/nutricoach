import { NextResponse } from 'next/server';
import { PACKAGE_NAME, PACKAGE_VERSION } from '@nutricoach/blog-preview';

export async function GET() {
  try {
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'blog-preview-integration',
      package: {
        name: PACKAGE_NAME,
        version: PACKAGE_VERSION,
      },
      features: {
        api: 'enabled',
        components: 'enabled',
        types: 'enabled',
        utils: 'enabled',
      },
      endpoints: {
        list: '/api/blog',
        detail: '/api/blog/[id]',
        slug: '/api/blog/slug/[slug]',
        health: '/api/blog-preview/health',
      },
      pages: {
        blog_list: '/blog',
        blog_detail: '/blog/[slug]',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        service: 'blog-preview-integration',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}