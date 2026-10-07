from django.apps import AppConfig

from evecsm.sheet.registry import Section, register


class CalendarConfig(AppConfig):
    name = "evecsm.sheet.calendar"
    label = "sheet_calendar"

    def ready(self):
        register(
            Section(
                key="calendar",
                label="Calendar",
                sync="evecsm.sheet.calendar.sync.sync",
                scopes=('esi-calendar.read_calendar_events.v1',),
                required_scopes=('esi-calendar.read_calendar_events.v1',),
                interval=1800,
                order=62,
            )
        )
        from . import api  # noqa: F401
