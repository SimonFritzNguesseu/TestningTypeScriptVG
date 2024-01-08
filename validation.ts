export function validateEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return emailRegex.test(email);
}


export function validateZipCode(zipCode: string): boolean {
    const zipCodeRegex = /^\d{5}(?:[-\s]\d{4})?$/;
    return zipCodeRegex.test(zipCode);
}

export function validatePersonalNumber(personalNumber: string): boolean {
    // Updated regex to match the pattern 123456-7890
    const personalNumberRegex = /^\d{6}-\d{4}$/;
    return personalNumberRegex.test(personalNumber);
}

export function validateText(text: string): boolean {
    const textRegex = /^[A-Za-z0-9\s]+$/;
    return textRegex.test(text);
}
