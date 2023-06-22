
const i18n = require('./i18.config')

module.exports = {
  i18n,
  trailingSlash: true,
  localePath: typeof window === 'undefined' ? require('path').resolve('./public/locales') : '/locales'
}
