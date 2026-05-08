import {getRequestConfig} from 'next-intl/server';
import {locales} from './config';

export default getRequestConfig(async ({locale}) => {
  // Ensure we have a valid locale string
  const targetLocale = (locale && locales.includes(locale as any)) 
    ? locale 
    : 'en';

  return {
    locale: targetLocale as string,
    messages: (await import(`../messages/${targetLocale}.json`)).default
  };
});
