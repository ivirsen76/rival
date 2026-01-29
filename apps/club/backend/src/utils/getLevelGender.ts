const getLevelGender = (name: string) => (/Women/i.test(name) ? 'female' : 'male');

export default getLevelGender;
