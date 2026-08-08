<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthUserRoleTest extends TestCase
{
    use RefreshDatabase;

    public function test_registering_frontend_user_stores_user_with_role_user(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Frontend User',
            'email' => 'frontend@example.com',
            'password' => 'secret123',
            'role' => 'user',
        ]);

        $response->assertStatus(200)
            ->assertJson(['status' => true]);

        $this->assertDatabaseHas('users', [
            'email' => 'frontend@example.com',
            'role' => 'user',
        ]);
    }
}
