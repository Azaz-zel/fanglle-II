<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Process;
use PHPUnit\Framework\Attributes\TestWith;
use Tests\TestCase;

// T-U9: boots a real separate process, because the guard must stop the app itself, not just a request.
class XenditKeyGuardTest extends TestCase
{
    private function boot(string $key)
    {
        return Process::path(base_path())
            ->env(['XENDIT_SECRET_KEY' => $key, 'LOG_CHANNEL' => 'null'])
            ->run([PHP_BINARY, 'artisan', 'env']);
    }

    #[TestWith(['xnd_production_fake'])]
    #[TestWith([''])]
    public function test_app_refuses_to_start_without_a_test_mode_key(string $key): void
    {
        $result = $this->boot($key);

        $this->assertTrue($result->failed());
        $this->assertStringContainsString('XENDIT_SECRET_KEY must be a test-mode key', $result->output().$result->errorOutput());
    }

    public function test_app_starts_with_a_test_mode_key(): void
    {
        $this->assertTrue($this->boot('xnd_development_anything')->successful());
    }
}
