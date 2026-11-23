# Деплой на Timeweb Cloud VPS

## Шаг 1: Создай аккаунт и VPS
1. Открой https://timeweb.cloud/
2. Нажми **Регистрация**
3. Заполни email и пароль
4. Подтверди email

## Шаг 2: Создай VPS
1. Перейди на вкладку **Cloud Servers**
2. Нажми **Создать сервер**
3. Настрой:
   - **ОС:** Ubuntu 22.04 LTS
   - **Тариф:** Basic (1 vCPU, 1 ГБ RAM, 25 ГБ SSD) — ~169₽/мес
   - **Регион:** Москва
   - **Тарифный план:** Поминутная оплата
4. Нажми **Создать сервер**
5. Дождись создания (1-2 минуты)

## Шаг 3: Подключись по SSH
1. В панели Timeweb найди свой сервер
2. Скопируй **IP-адрес** и **логин root**
3. Открой терминал (PowerShell) и подключись:
```powershell
ssh root@твой-ip-адрес
```
4. Введи пароль (создан при создании сервера)

## Шаг 4: Установка Docker и Docker Compose
```bash
# Обновление системы
apt update && apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Добавление пользователя в группу docker (опционально)
usermod -aG docker root

# Установка Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Проверка установки
docker --version
docker-compose --version
```

## Шаг 5: Загрузка проекта
```bash
# Клонирование репозитория
cd /root
git clone https://github.com/djmakisnov-max/weather-app.git
cd weather-app
```

## Шаг 6: Настройка переменных окружения
```bash
# Генерация SECRET_KEY
python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

# Создание .env файла
nano .env
```

Вставь содержимое:
```
SECRET_KEY=твой_сгенерированный_ключ
DEBUG=0
ALLOWED_HOSTS=твой-домен,твой-ip-адрес
```

Сохрани: `Ctrl+O`, `Enter`, `Ctrl+X`

## Шаг 7: Сборка и запуск Docker-контейнера
```bash
# Сборка образа
docker build -t weather-app .

# Запуск контейнера
docker run -d \
  --name weather-app \
  --restart unless-stopped \
  -p 8000:8000 \
  -v $(pwd)/staticfiles:/app/staticfiles \
  weather-app
```

## Шаг 8: Настройка домена (опционально)
1. Купи домен на reg.ru или timeweb.ru
2. В настройках домена создай A-запись:
   - **Тип:** A
   - **Имя:** @ (или www)
   - **Значение:** IP-адрес твоего VPS
3. Подожди обновления DNS (до 24 часов)

## Шаг 9: Настройка Nginx (опционально)
```bash
# Установка Nginx
apt install nginx -y

# Создание конфигурации
nano /etc/nginx/sites-available/weather-app
```

Вставь содержимое:
```nginx
server {
    listen 80;
    server_name твой-домен.ru www.твой-домен.ru;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Сохрани и активируй:
```bash
ln -s /etc/nginx/sites-available/weather-app /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## Шаг 10: Настройка SSL (Let's Encrypt)
```bash
# Установка Certbot
apt install certbot python3-certbot-nginx -y

# Получение сертификата
certbot --nginx -d твой-домен.ru -d www.твой-домен.ru
```

## Управление контейнером

### Перезапуск контейнера
```bash
docker restart weather-app
```

### Просмотр логов
```bash
docker logs weather-app
```

### Остановка контейнера
```bash
docker stop weather-app
```

### Удаление контейнера
```bash
docker rm -f weather-app
```

## Возможные проблемы

### Ошибка подключения к Docker
```bash
systemctl restart docker
```

### Порт уже занят
```bash
# Проверка, что использует порт
netstat -tlnp | grep 8000

# Остановка процесса
kill -9 PID
```

### Ошибка базы данных
SQLite работает из коробки, но если нужен PostgreSQL:
```bash
# Установка PostgreSQL
apt install postgresql -y

# Создание базы
sudo -u postgres psql
CREATE DATABASE weather;
CREATE USER weather WITH PASSWORD 'weather';
ALTER ROLE weather SET client_encoding TO 'utf8';
ALTER ROLE weather SET default_transaction_isolation TO 'read committed';
ALTER ROLE weather SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE weather TO weather;
\q
```

### Сайт не открывается
```bash
# Проверка firewall
ufw allow 80
ufw allow 443
ufw allow 22
ufw enable

# Проверка Nginx
systemctl status nginx
```
