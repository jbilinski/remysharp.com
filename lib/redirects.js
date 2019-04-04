module.exports = async collections => {
  const res = [
    ...collections.blog
      .filter(post => post.data.date.toString().slice(0, 4) >= '2018')
      .map(post => `/draft/${post.slug} ${post.url} 301`),
    '/cli-book https://abookapart.com/products/working-the-command-line 301',
    '/talks /speaking/ 301',
    '/feed/ /feed.xml 301',
    '/2016/03/22/the-copy--paste-guide-to-your-first-service-worker /2016/03/22/the-copy-paste-guide-to-your-first-service-worker 301',
    `/images/* https://download-remysharp.netlify.com/:splat 200`,
    `/downloads/* https://download-remysharp.netlify.com/:splat 200`,
    `/latest ${collections.blog[0].url} 307`, // important, this is temp redirect
  ];

  res.push('/*/amp /:splat');

  // THIS here is the place where real content is served correctly

  res.push('/build/* /404.html 404'); // real 404
  res.push(
    '/* https://us-central1-logger-29da8.cloudfunctions.net/log?url=:splat 200'
  );

  return res.join('\n');
};
