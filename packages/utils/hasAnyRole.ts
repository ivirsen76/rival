export default function hasAnyRole(user, desiredRoles) {
    if (!user) {
        return false;
    }

    const userRoles = user.roles.split(',');

    return userRoles.some((role) => desiredRoles.includes(role));
}
