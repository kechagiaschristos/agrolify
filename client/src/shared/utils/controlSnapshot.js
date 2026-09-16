export const isOlderControlSnapshot = (current, incoming) => {
    if (!current || !incoming || current.id !== incoming.id) return false;
    const previousCommand = current.command;
    const nextCommand = incoming.command;
    if (previousCommand && !nextCommand) return true;
    if (!previousCommand || !nextCommand) return false;
    if (previousCommand.id === nextCommand.id && previousCommand.status !== 'pending' && nextCommand.status === 'pending') return true;
    return new Date(previousCommand.updated_at) > new Date(nextCommand.updated_at);
};
