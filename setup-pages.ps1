# Скрипт для автоматической настройки GitHub Pages
# Требует авторизации в GitHub CLI

Write-Host "🔧 Настройка GitHub Pages для cognetive-kids..." -ForegroundColor Cyan

# Проверка авторизации
Write-Host "`nПроверка авторизации GitHub CLI..." -ForegroundColor Yellow
$authStatus = gh auth status 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Требуется авторизация в GitHub CLI" -ForegroundColor Red
    Write-Host "`nВыполните команду:" -ForegroundColor Yellow
    Write-Host "gh auth login" -ForegroundColor Green
    Write-Host "`nИли настройте GitHub Pages вручную:" -ForegroundColor Yellow
    Write-Host "1. Откройте: https://github.com/atmega-p471/cognetive-kids/settings/pages" -ForegroundColor Cyan
    Write-Host "2. Выберите Source: GitHub Actions" -ForegroundColor Cyan
    Write-Host "3. Сохраните" -ForegroundColor Cyan
    exit 1
}

Write-Host "✅ Авторизация успешна" -ForegroundColor Green

# Проверка статуса Pages
Write-Host "`nПроверка текущего статуса GitHub Pages..." -ForegroundColor Yellow
try {
    $pagesStatus = gh api repos/atmega-p471/cognetive-kids/pages 2>&1
    Write-Host "Текущий статус:" -ForegroundColor Cyan
    Write-Host $pagesStatus
} catch {
    Write-Host "GitHub Pages еще не настроен" -ForegroundColor Yellow
}

Write-Host "`n📝 Примечание:" -ForegroundColor Yellow
Write-Host "GitHub Pages должен быть настроен через веб-интерфейс:" -ForegroundColor White
Write-Host "1. Откройте: https://github.com/atmega-p471/cognetive-kids/settings/pages" -ForegroundColor Cyan
Write-Host "2. В разделе 'Source' выберите: GitHub Actions" -ForegroundColor Cyan
Write-Host "3. Сохраните изменения" -ForegroundColor Cyan
Write-Host "`nПосле этого workflow автоматически задеплоит сайт!" -ForegroundColor Green

Write-Host "`n✅ Готово! После настройки сайт будет доступен по адресу:" -ForegroundColor Green
Write-Host "https://atmega-p471.github.io/cognetive-kids/" -ForegroundColor Cyan

