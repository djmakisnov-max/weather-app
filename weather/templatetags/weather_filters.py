from django import template

register = template.Library()

WMO_CODES = {
    0:  {'desc': 'Ясно',                'dayIcon': '☀️', 'nightIcon': '🌙', 'bg': 'clear'},
    1:  {'desc': 'Преимущественно ясно', 'dayIcon': '🌤️', 'nightIcon': '🌙', 'bg': 'clear'},
    2:  {'desc': 'Переменная облачность', 'dayIcon': '⛅', 'nightIcon': '☁️', 'bg': 'clouds'},
    3:  {'desc': 'Пасмурно',            'dayIcon': '☁️', 'nightIcon': '☁️', 'bg': 'clouds'},
    45: {'desc': 'Туман',               'dayIcon': '🌫️', 'nightIcon': '🌫️', 'bg': 'fog'},
    48: {'desc': 'Изморозь',            'dayIcon': '🌫️', 'nightIcon': '🌫️', 'bg': 'fog'},
    51: {'desc': 'Лёгкая морось',       'dayIcon': '🌦️', 'nightIcon': '🌧️', 'bg': 'rain'},
    53: {'desc': 'Морось',              'dayIcon': '🌦️', 'nightIcon': '🌧️', 'bg': 'rain'},
    55: {'desc': 'Сильная морось',      'dayIcon': '🌧️', 'nightIcon': '🌧️', 'bg': 'rain'},
    56: {'desc': 'Ледяная морось',      'dayIcon': '🌧️', 'nightIcon': '🌧️', 'bg': 'rain'},
    57: {'desc': 'Сильная ледяная морось', 'dayIcon': '🌧️', 'nightIcon': '🌧️', 'bg': 'rain'},
    61: {'desc': 'Небольшой дождь',     'dayIcon': '🌦️', 'nightIcon': '🌧️', 'bg': 'rain'},
    63: {'desc': 'Дождь',               'dayIcon': '🌧️', 'nightIcon': '🌧️', 'bg': 'rain'},
    65: {'desc': 'Сильный дождь',       'dayIcon': '🌧️', 'nightIcon': '🌧️', 'bg': 'rain'},
    66: {'desc': 'Ледяной дождь',       'dayIcon': '🌧️', 'nightIcon': '🌧️', 'bg': 'rain'},
    67: {'desc': 'Сильный ледяной дождь', 'dayIcon': '🌧️', 'nightIcon': '🌧️', 'bg': 'rain'},
    71: {'desc': 'Небольшой снег',      'dayIcon': '🌨️', 'nightIcon': '🌨️', 'bg': 'snow'},
    73: {'desc': 'Снег',                'dayIcon': '🌨️', 'nightIcon': '🌨️', 'bg': 'snow'},
    75: {'desc': 'Сильный снег',        'dayIcon': '❄️', 'nightIcon': '❄️', 'bg': 'snow'},
    77: {'desc': 'Снежная крупа',       'dayIcon': '🌨️', 'nightIcon': '🌨️', 'bg': 'snow'},
    80: {'desc': 'Небольшой ливень',    'dayIcon': '🌦️', 'nightIcon': '🌧️', 'bg': 'rain'},
    81: {'desc': 'Ливень',              'dayIcon': '🌧️', 'nightIcon': '🌧️', 'bg': 'rain'},
    82: {'desc': 'Сильный ливень',      'dayIcon': '🌧️', 'nightIcon': '🌧️', 'bg': 'rain'},
    85: {'desc': 'Небольшой снегопад',  'dayIcon': '🌨️', 'nightIcon': '🌨️', 'bg': 'snow'},
    86: {'desc': 'Сильный снегопад',    'dayIcon': '❄️', 'nightIcon': '❄️', 'bg': 'snow'},
    95: {'desc': 'Гроза',               'dayIcon': '⛈️', 'nightIcon': '⛈️', 'bg': 'storm'},
    96: {'desc': 'Гроза с градом',      'dayIcon': '⛈️', 'nightIcon': '⛈️', 'bg': 'storm'},
    99: {'desc': 'Сильная гроза с градом', 'dayIcon': '⛈️', 'nightIcon': '⛈️', 'bg': 'storm'},
}


@register.filter
def wmo_icon(code, is_day):
    info = WMO_CODES.get(int(code), {'dayIcon': '🌡️', 'nightIcon': '🌡️'})
    return info['dayIcon'] if is_day else info['nightIcon']


@register.filter
def wmo_desc(code):
    info = WMO_CODES.get(int(code), {'desc': 'Неизвестно'})
    return info['desc']


@register.filter
def wmo_bg(code):
    info = WMO_CODES.get(int(code), {'bg': 'clouds'})
    return info['bg']


@register.filter
def bg_class(code, is_day):
    """Возвращает CSS-класс фона на основе WMO-кода и времени суток."""
    bg = wmo_bg(code)
    prefix = 'day' if is_day else 'night'
    return f'bg-{prefix}-{bg}'
