<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\File;
use Tests\TestCase;

class SpaTest extends TestCase
{
    private string $public;

    protected function setUp(): void
    {
        parent::setUp();
        // A throwaway public dir, so a real frontend build in public/app is never touched.
        $this->public = storage_path('framework/testing/public');
        File::deleteDirectory($this->public);
        $this->app->usePublicPath($this->public);
    }

    protected function tearDown(): void
    {
        File::deleteDirectory($this->public);
        parent::tearDown();
    }

    public function test_without_a_frontend_build_pages_are_404(): void
    {
        $this->get('/admin')->assertNotFound();
    }

    public function test_every_page_outside_api_and_sanctum_gets_the_react_build(): void
    {
        File::ensureDirectoryExists($this->public.'/app');
        File::put($this->public.'/app/index.html', '<div id="root"></div>');

        foreach (['/', '/events/2026-09-25', '/door', '/admin/team', '/p/01J9ZQ7K4M'] as $uri) {
            $file = $this->get($uri)->assertOk()->assertHeader('Content-Type', 'text/html; charset=utf-8')->baseResponse->getFile();
            $this->assertSame('<div id="root"></div>', file_get_contents($file->getPathname()));
        }

        $this->get('/api/nothing-here')->assertNotFound()->assertExactJsonStructure(['message']);
        $this->get('/sanctum/csrf-cookie')->assertNoContent()->assertCookie('XSRF-TOKEN');
    }
}
