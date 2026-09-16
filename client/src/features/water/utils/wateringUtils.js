import dayjs from 'dayjs';

export const WATERING_DAY_ORDER = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
];

const WATERING_DAY_KEYS = {
    Monday: 'watering.days.monday',
    Tuesday: 'watering.days.tuesday',
    Wednesday: 'watering.days.wednesday',
    Thursday: 'watering.days.thursday',
    Friday: 'watering.days.friday',
    Saturday: 'watering.days.saturday',
    Sunday: 'watering.days.sunday',
};

export const parseScheduleTime = (value) => dayjs(value, ['h:mm A', 'hh:mm A', 'HH:mm', 'HH:mm:ss'], true);

export const getWateringDayLabel = (t, day) => t(WATERING_DAY_KEYS[day] || 'common.notAvailable');

export const getWateringDayName = (dayOfWeek) => WATERING_DAY_ORDER[dayOfWeek === 0 ? 6 : dayOfWeek - 1] || 'Monday';

const formatTimestampAsTime = (value) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');

    return `${hours}:${minutes}`;
};

export const formatScheduleTimeLabel = (value) => {
    if (!value) {
        return '';
    }

    const parsedValue = parseScheduleTime(value);
    if (parsedValue.isValid()) {
        return parsedValue.format('h:mm A');
    }

    const timestamp = new Date(value);

    if (!Number.isNaN(timestamp.getTime())) {
        return new Intl.DateTimeFormat(undefined, {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: 'UTC',
        }).format(timestamp);
    }

    return String(value);
};

export const normalizeScheduleTime = (value) => {
    if (!value) {
        return '';
    }

    const parsedValue = parseScheduleTime(value);
    if (parsedValue.isValid()) {
        return parsedValue.format('HH:mm');
    }

    const formattedTimestamp = formatTimestampAsTime(value);

    if (formattedTimestamp) {
        return formattedTimestamp;
    }

    return String(value);
};

export const normalizeWateringSchedule = (schedule) => ({
    ...schedule,
    day: getWateringDayName(schedule?.day_of_week),
    start: normalizeScheduleTime(schedule?.start_time),
    finish: normalizeScheduleTime(schedule?.end_time),
    startLabel: formatScheduleTimeLabel(schedule?.start_time),
    finishLabel: formatScheduleTimeLabel(schedule?.end_time),
    status: schedule?.active ? 'active' : 'inactive',
});

export const formatRuntimeLabel = (minutes, t) => {
    const totalMinutes = Number(minutes) || 0;

    if (totalMinutes < 60) {
        return `${totalMinutes} ${t('common.minuteUnit')}`;
    }

    const hours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    if (remainingMinutes === 0) {
        return `${hours} ${t('common.hourUnit')}`;
    }

    return `${hours} ${t('common.hourUnit')} ${remainingMinutes} ${t('common.minuteUnit')}`;
};

export const getWateringScheduleStats = (events = []) => {
    const orderedEvents = [...events].sort((first, second) => {
        const firstDayIndex = WATERING_DAY_ORDER.indexOf(first.day);
        const secondDayIndex = WATERING_DAY_ORDER.indexOf(second.day);

        if (firstDayIndex !== secondDayIndex) {
            return firstDayIndex - secondDayIndex;
        }

        return parseScheduleTime(first.start).valueOf() - parseScheduleTime(second.start).valueOf();
    });
    const activeEvent = orderedEvents.find((event) => event.status === 'active') || null;
    const nextEvent = orderedEvents[0] || null;
    const activeOrderedEvents = orderedEvents.filter((event) => event.status === 'active');
    const daysWithEvents = new Set(orderedEvents.map((event) => event.day));
    const activeScheduledDaysSet = new Set(
        activeOrderedEvents.map((event) => event.day),
    );
    const inactiveScheduledDaysSet = new Set(
        [...daysWithEvents].filter((day) => !activeScheduledDaysSet.has(day)),
    );
    const scheduledDays = daysWithEvents.size;
    const weeklyRuntime = activeOrderedEvents.reduce((sum, event) => {
        const start = parseScheduleTime(event.start);
        const finish = parseScheduleTime(event.finish);

        if (!start.isValid() || !finish.isValid()) {
            return sum;
        }

        return sum + Math.max(0, finish.diff(start, 'minute'));
    }, 0);

    return {
        orderedEvents,
        activeOrderedEvents,
        activeEvent,
        nextEvent,
        scheduledDays,
        activeScheduledDays: activeScheduledDaysSet.size,
        inactiveScheduledDays: inactiveScheduledDaysSet.size,
        weeklyRuntime,
        coverage: Math.min(100, orderedEvents.length * 18),
    };
};
