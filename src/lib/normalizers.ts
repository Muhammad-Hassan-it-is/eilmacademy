const PAKISTANI_MOBILE_PREFIX = "3";
const PAKISTANI_MOBILE_LENGTH = 10;

export function normalizePhone(
  phone: string | null | undefined,
): string | null {
  if (!phone) {
    return null;
  }

  const trimmedPhone = phone.trim();
  if (!/^[+\d\s().-]+$/.test(trimmedPhone) || (trimmedPhone.includes("+") && !trimmedPhone.startsWith("+"))) {
    return null;
  }

  const digits = trimmedPhone.replace(/\D/g, "");
  let mobileNumber: string;

  if (trimmedPhone.startsWith("+")) {
    if (!/^\+92/.test(trimmedPhone)) {
      return null;
    }

    mobileNumber = digits.slice(2);
  } else if (digits.startsWith("0092")) {
    mobileNumber = digits.slice(4);
  } else if (digits.startsWith("03")) {
    mobileNumber = digits.slice(1);
  } else {
    mobileNumber = digits;
  }

  if (
    mobileNumber.length !== PAKISTANI_MOBILE_LENGTH ||
    !mobileNumber.startsWith(PAKISTANI_MOBILE_PREFIX)
  ) {
    return null;
  }

  return `+92${mobileNumber}`;
}

export function normalizeName(name: string | null | undefined): string {
  if (!name) {
    return "";
  }

  return name
    .trim()
    .toLowerCase()
    .replace(/\b(?:dr|hafiz|mr|mrs|syed|engr)\.?\b/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}