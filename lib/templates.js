const fs = require('fs-extra');
const { promisify } = require('util');
const { join, parse } = require('path');
const md = require('markdown-it')({ html: true });
const format = require('date-fns/format');
const distanceInWordsStrict = require('date-fns/distance_in_words_strict');
const differenceInCalendarDays = require('date-fns/difference_in_calendar_days');
const differenceInCalendarYears = require('date-fns/difference_in_calendar_years');
const getDayOfYear = require('date-fns/get_day_of_year');
const addDays = require('date-fns/add_days');
const findPartial = require('./find-partial');
const loadLocalData = require('./load-local-data');
const pug = require('pug');
const matter = require('gray-matter');
const approx = require('approximate-number');
const generateOutputPath = require('./generate-output-path');
const permalink = require('./permalink');
const TurndownService = require('turndown');
const hashFiles = promisify(require('hash-files'));
const now = new Date();
const td = new TurndownService();

const { cwd, input, output, ...globals } = require('./globals');
const { glob, globFor } = require('./glob');

const commons = {
  pretty: true,
  basedir: input,
  markdown: s => md.render(s.replace(/\\([->_*])/g, '$1')),
  turndown: s => td.turndown(s).replace(/\\([->_*])/g, '$1'),
  filters: {
    marked: s => md.render(s),
    markdown: s => md.render(s),
  },
  approx,
  moment(date = now) {
    return {
      age: () => differenceInCalendarYears(new Date(), date),
      ageInDays: () => differenceInCalendarDays(new Date(), date),
      ago: () => distanceInWordsStrict(new Date(), date),
      format: str => format(date, str),
      modDOY: n => getDayOfYear(date) % n,
    };
  },
  duration(fromDate, toDate) {
    return distanceInWordsStrict(
      new Date(fromDate),
      addDays(new Date(toDate), 1)
    );
  },
  ...globals,
};

async function getRevHashes() {
  const hashes = await Promise.all([
    hashFiles({ files: input + '/js/**/*.js' }),
    hashFiles({ files: input + '/css/*' }),
  ]);

  commons.hashes = {
    js: hashes[0].slice(-6),
    css: hashes[1].slice(-6),
  };
}

// FIXME - I don't think partial blocks are working properly
function partial({ collections, commons }) {
  return (filename, locals) => {
    const ext = ['pug', 'md', 'html'].find(
      findPartial.bind(null, join(cwd, input), filename)
    );

    const options = {
      ...locals,
      ...commons,
      collections,
    };

    filename = join(cwd, input, filename + '.' + ext);

    if (ext === 'md') {
      // transform first
      const content = md.render(fs.readFileSync(filename, 'utf8'));
      return pug.render(content, filename, { ...options, filename });
    }

    return pug.renderFile(filename, options);
  };
}

module.exports = async function loadTransforms(content, collections) {
  const filenames = await glob(globFor('pug'));

  await getRevHashes();

  const pages = [];
  const templates = [];
  const layouts = {};

  commons.collections = collections;
  commons.partial = partial({ collections, commons });

  filenames.forEach(_ => {
    if (!(_.startsWith('_') || _.includes('/_'))) {
      return pages.push(_);
    }

    if (_.includes('layout.pug')) {
      const parsed = parse(_);

      // NOTE: I'm using sync read here because I know there will be a limited
      // number of layouts, so the perf cost is very low.
      layouts[parsed.dir] = pug.compile(fs.readFileSync(_, 'utf8'), {
        compileDebug: true,
        filename: _,
        ...commons,
      });
      return;
    }

    templates.push(_);
  });

  const pagesRendered =
    content.length > 1
      ? pages.map(inputPath => {
          const content = {
            inputPath,
          };
          const { dir, name } = parse(inputPath);

          content.outputPath = generateOutputPath(input, output, content);
          content.dir = dir;
          content.filename = name;

          content.input = fs.readFileSync(inputPath, 'utf8');
          const fm = matter(content.input);
          content.data = { ...fm.data }; // ensure it's a copy

          Object.keys(content.data).forEach(key => {
            content.data[key] = (content.data[key] + '').replace(
              /(?:{{\s*(\S+)\s*}})/g,
              (all, match) => {
                return content[match];
              }
            );
          });

          if (content.data.permalink) {
            content.outputPath = permalink(content);
          }

          content.url = content.outputPath
            .replace(/(\/index)?\.html$/, '')
            .replace(output, '');

          if (!content.url) content.url = '/';

          content.output = pug.render(fm.content, {
            filename: inputPath,
            current: {
              path: dir.split('/').slice(1),
              source: name,
              ...content,
            },
            ...loadLocalData(inputPath),
            ...content,
            ...content.data,
            ...commons,
          });

          return content;
        })
      : [];

  return content.concat(pagesRendered).map(post => {
    const { dir, name } = parse(post.inputPath);

    const layout = layouts[dir] || layouts.public;
    if (layout && post.data.layout !== 'false') {
      let title = post.data && post.data.title;
      const [_title, ...rest] = post.output.split('\n');
      post.output = rest.join('\n');
      if (_title.includes('<h1>')) {
        title = _title.replace(/<h1>(.*)<\/h1>/, '$1');
      }
      const localData = loadLocalData(post.inputPath);

      post.output = layout({
        current: {
          path: dir
            .split('/')
            .slice(1)
            .concat(name),
          source: name,
          ...post,
        },
        ...localData,
        yield: post.output,
        title, // can be overwritten by `data`
        ...(post.data || localData._data || {}),
        ...post,
        ...commons,
      });
    }
    return post;
  });
};
