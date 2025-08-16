# Test all login endpoints
Write-Host "🧪 Testing All Login Endpoints" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

$users = @(
    @{ email = "admin@framtt.com"; role = "Superadmin" },
    @{ email = "admin.user@framtt.com"; role = "Admin User" },
    @{ email = "csm1@framtt.com"; role = "CSM 1" },
    @{ email = "csm2@framtt.com"; role = "CSM 2" },
    @{ email = "superadmin@framtt.com"; role = "Superadmin 2" }
)

$headers = @{
    "Content-Type" = "application/json"
}

foreach ($user in $users) {
    Write-Host "`n🔐 Testing login for $($user.role): $($user.email)" -ForegroundColor Yellow
    
    $body = @{
        email = $user.email
        password = "admin123"
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $body -Headers $headers
        Write-Host "✅ SUCCESS!" -ForegroundColor Green
        Write-Host "   User: $($response.data.user.fullName)" -ForegroundColor Green
        Write-Host "   Role: $($response.data.user.role)" -ForegroundColor Green
        Write-Host "   Token: $($response.data.token.Substring(0, 20))..." -ForegroundColor Green
    } catch {
        Write-Host "❌ FAILED!" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n🎉 All endpoint tests completed!" -ForegroundColor Cyan
