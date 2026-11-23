import json
import requests
from django.http import JsonResponse
from django.shortcuts import render

OPEN_METEO_FORECAST = 'https://api.open-meteo.com/v1/forecast'
OPEN_METEO_GEOCODING = 'https://geocoding-api.open-meteo.com/v1/search'

DEFAULT_CITY = {'name': 'Москва', 'lat': 55.7558, 'lon': 37.6173}


def index(request):
    last_city = request.session.get('last_city', DEFAULT_CITY)
    return render(request, 'weather/base.html', {'last_city': last_city})


def weather_data(request):
    lat = request.GET.get('lat')
    lon = request.GET.get('lon')
    city = request.GET.get('city', '')

    if not lat or not lon:
        return JsonResponse({'error': 'Не указаны координаты'}, status=400)

    params = {
        'latitude': lat,
        'longitude': lon,
        'current': 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,surface_pressure,weather_code,is_day',
        'hourly': 'temperature_2m,weather_code',
        'daily': 'temperature_2m_max,temperature_2m_min,weather_code',
        'timezone': 'auto',
        'forecast_days': 7,
        'wind_speed_unit': 'ms',
    }

    try:
        resp = requests.get(OPEN_METEO_FORECAST, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        data['city'] = city
        # Сохраняем город в сессию
        request.session['last_city'] = {'name': city, 'lat': float(lat), 'lon': float(lon)}
        return JsonResponse(data)
    except requests.RequestException as e:
        return JsonResponse({'error': 'Не удалось загрузить данные о погоде'}, status=500)


def city_search(request):
    name = request.GET.get('name', '')

    if len(name) < 2:
        return JsonResponse({'results': []})

    params = {
        'name': name,
        'count': 5,
        'language': 'ru',
        'format': 'json',
    }

    try:
        resp = requests.get(OPEN_METEO_GEOCODING, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        results = data.get('results', [])

        formatted = []
        for r in results:
            formatted.append({
                'name': r.get('name', ''),
                'latitude': r.get('latitude', 0),
                'longitude': r.get('longitude', 0),
                'admin1': r.get('admin1', ''),
                'country': r.get('country', ''),
            })

        return JsonResponse({'results': formatted})
    except requests.RequestException:
        return JsonResponse({'results': []})


def save_city(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body)
        city_name = data.get('name', '')
        lat = data.get('lat')
        lon = data.get('lon')

        if not city_name or lat is None or lon is None:
            return JsonResponse({'error': 'Недостаточно данных'}, status=400)

        request.session['last_city'] = {'name': city_name, 'lat': float(lat), 'lon': float(lon)}
        return JsonResponse({'status': 'ok'})
    except (json.JSONDecodeError, ValueError):
        return JsonResponse({'error': 'Неверный формат данных'}, status=400)
