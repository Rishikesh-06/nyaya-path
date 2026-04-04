export const LAWYER_CATEGORIES = [
  'Criminal',
  'Civil',
  'Property',
  'Consumer Rights',
  'Cyber'
];

export const getNativeCategoriesForLawyerSpec = (lawyerSpecs: string[]): string[] => {
  const nativeCategories = new Set<string>();

  if (lawyerSpecs.includes('Criminal')) {
    nativeCategories.add('Criminal');
  }
  if (lawyerSpecs.includes('Civil')) {
    nativeCategories.add('Civil');
    nativeCategories.add('Family Disputes');
    nativeCategories.add('Domestic Violence');
    nativeCategories.add('Education');
    nativeCategories.add('Other');
  }
  if (lawyerSpecs.includes('Property')) {
    nativeCategories.add('Property');
    nativeCategories.add('Tenant Rights');
  }
  if (lawyerSpecs.includes('Consumer Rights')) {
    nativeCategories.add('Consumer Rights');
    nativeCategories.add('Labor Law');
  }
  if (lawyerSpecs.includes('Cyber')) {
    nativeCategories.add('Cyber');
    nativeCategories.add('Other');
  }

  return Array.from(nativeCategories);
};

export const mapNativeCategoryToLawyer = (nativeCat: string, desc: string = ''): string => {
  if (nativeCat === 'Criminal') return 'Criminal';

  if (['Property', 'Tenant Rights'].includes(nativeCat)) return 'Property';

  if (['Consumer Rights', 'Labor Law'].includes(nativeCat)) return 'Consumer Rights';

  if (nativeCat === 'Other' || nativeCat === 'Cyber') {
    const d = desc.toLowerCase();
    if (d.includes('fraud') || d.includes('scam') || d.includes('cyber') || d.includes('online')) {
      return 'Cyber';
    }
    return 'Civil';
  }

  // Covers Civil, Domestic Violence, Education, Family Disputes, etc.
  return 'Civil';
};
