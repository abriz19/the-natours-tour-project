// "jane.doe@gmail.com" -> "j•••@gmail.com"
module.exports = email => {
    if (!email || !email.includes('@')) return email;
    const [name, domain] = email.split('@');
    return `${name.charAt(0)}•••@${domain}`;
};
