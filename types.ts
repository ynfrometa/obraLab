export type SingleNavItem = { title: string; href: string; outlined?: boolean };

export type NavGroup = {
  title: string;
  items: SingleNavItem[];
};

export type NavItem = SingleNavItem | NavGroup;

export type NavItems = NavItem[];

export type SingleArticle = {
  slug: string;
  content: string;
  meta: {
    title: string;
    description: string;
    date: string;
    tags: string;
    imageUrl: string;
  };
};

export type NonNullableChildren<T> = { [P in keyof T]: Required<NonNullable<T[P]>> };

export type NonNullableChildrenDeep<T> = {
  [P in keyof T]-?: NonNullableChildrenDeep<NonNullable<T[P]>>;
};
