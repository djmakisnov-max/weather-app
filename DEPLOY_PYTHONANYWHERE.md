# Деплой на PythonAnywhere

## Шаг 1: Создай аккаунт
1. Открой https://www.pythonanywhere.com/register/free/
2. Нажми **Sign up**
3. Выбери **Free** тариф
4. Заполни логин, email, пароль
5. Подтверди email

## Шаг 2: Загрузи код
1. Войди в аккаунт
2. Перейди на вкладку **Files** → **/home/твой-логин/**
3. Нажми **Upload files** и загрузи ВСЕ файлы проекта:
   - manage.py
   - requirements.txt
   - Dockerfile, docker-compose.yml
   - .env.example, .dockerignore, nginx.conf
   - .gitignore
   - папки: weather/, weather_project/, static/, css/, js/

Или клонируй репозиторий:
```bash
git clone https://github.com/djmakisnov-max/weather-app.git
cd weather-app
```

## Шаг 3: Создай виртуальное окружение
1. Перейди на вкладку **Consoles**
2. Выбери **Bash**
3. Выполни:
```bash
cd /home/твой-логин/weather-app
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py collectstatic --noinput
python manage.py migrate
```

## Шаг 4: Настрой Web-приложение
1. Перейди на вкладку **Web**
2. Нажми **Add a new web app**
3. Выбери **Manual configuration** → **Next**
4. Выбери **Python 3.10** (или доступную версию)
5. Нажми **Next**

## Шаг 5: Настрой WSGI
1. На странице настройки веб-приложения найди секцию **WSGI configuration file**
2. Нажми **Edit file**
3. Замени содержимое на:
```python
import os
import sys

# Добавь путь к проекту
path = '/home/твой-логин/weather-app'
if path not in sys.path:
    sys.path.append(path)

os.environ['DJANGO_SETTINGS_MODULE'] = 'weather_project.settings'

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
```

## Шаг 6: Настрой Virtualenv
1. На странице **Web** найди секцию **Virtualenv**
2. Введи путь: `/home/твой-логин/weather-app/venv`
3. Нажми **Save**

## Шаг 7: Настрой Static Files
1. На странице **Web** найди секцию **Static files**
2. URL: `/static/`
3. Путь: `/home/твой-логин/weather-app/staticfiles/`
4. Нажми **Save**

## Шаг 8: Перезагрузи
1. Нажми большую зелёную кнопку **Reload weather-app**
2. Готово! Приложение доступно по адресу:
   `https://твой-логин.pythonanywhere.com/`

## Возможные проблемы

### Ошибка импорта
Проверь, что путь в WSGI файле правильный:
```python
path = '/home/твой-логин/weather-app'
```

### Ошибка базы данных
Убедись, что выполнил:
```bash
python manage.py migrate
```

### Статика не загружается
Убедись, что выполнил:
```bash
python manage.py collectstatic --noinput
```

### Ошибка 500
Посмотри логи на вкладке **Web** → **Error log**
