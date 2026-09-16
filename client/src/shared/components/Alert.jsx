import {useEffect} from 'react';
import {App} from 'antd';

const pendingAlerts = [];
const listeners = new Set();

const notifyListeners = (alert) => {
    listeners.forEach((listener) => {
        listener(alert);
    });
};

const subscribeToAlerts = (listener) => {
    listeners.add(listener);

    while (pendingAlerts.length > 0) {
        listener(pendingAlerts.shift());
    }

    return () => {
        listeners.delete(listener);
    };
};

function Alert() {
    const {message} = App.useApp();

    useEffect(() => {
        const unsubscribe = subscribeToAlerts(({type = 'info', message: content, duration = 3}) => {
            if (!content) {
                return;
            }

            message.open({
                type,
                content,
                duration,
            });
        });

        return unsubscribe;
    }, [message]);

    return null;
}

Alert.show = ({type = 'info', message, duration = 3}) => {
    if (!message) {
        return;
    }

    const nextAlert = {
        type,
        message,
        duration,
    };

    if (listeners.size === 0) {
        pendingAlerts.push(nextAlert);
        return;
    }

    notifyListeners(nextAlert);
};

export default Alert;
