// Vârsta în ani împliniți, din data nașterii 'YYYY-MM-DD'. null dacă data lipsește.
export function calculateAge(birthDate: string | null | undefined): number | null {
    if (!birthDate) return null;
    const [year, month, day] = birthDate.split('-').map(Number);
    const now = new Date();
    let age = now.getFullYear() - year;
    // Dacă ziua de naștere din anul acesta n-a venit încă, mai scădem un an
    const birthdayPassed = now.getMonth() + 1 > month || (now.getMonth() + 1 === month && now.getDate() >= day);
    if (!birthdayPassed) age--;
    return age;
}

// Sub 18 ani = copil
export function categoryFromBirthDate(birthDate: string | null | undefined): 'adult' | 'copil' | null {
    const age = calculateAge(birthDate);
    if (age === null) return null;
    return age < 18 ? 'copil' : 'adult';
}
