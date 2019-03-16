const pluginRss = require('@11ty/eleventy-plugin-rss');
global.moment = require('moment');

module.exports = function(eleventyConfig) {
  const copy = ['/public/css', '/public/images'].map(filename => {
    console.log('-> %s', __dirname + filename);

    eleventyConfig.addPassthroughCopy(__dirname + filename);
  });

  // eleventyConfig.addPlugin(pluginRss);

  // layouts
  eleventyConfig.addLayoutAlias('blog', 'blog/_layout.pug');

  // collection helpers

  eleventyConfig.addCollection('latest', function(collection) {
    const res = collection.getFilteredByGlob('*/blog/*.md');
    return res[res.length - 1];
  });

  eleventyConfig.addCollection('blog', function(collection) {
    const res = collection.getFilteredByGlob('*/blog/*.md');
    return res;
  });
  // }

  return {
    dir: {
      data: './_data', // relative to `input`
      input: './public',
      output: './_site',
    },
    passthroughFileCopy: false,
  };
};
