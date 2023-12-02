<img src="DALL·E 2023-12-02 17.28.16 - An oil painting by Claude Monet of a cat with sunglasses reading a book.png" alt="Myself on a Saturday Afternoon" width="200"/>

# [enriquekesslerm.com](https://enriquekesslerm.com)

My (second, see [first](https://github.com/Qkessler/Gatsby-enriquekesslerm.com)) personal web is officially up and running!

This time, rather than spending the time building components and using a library for compiling my org files, I decided for everything to be as close to the bone as possible: static site generation. Since I support Rust deeply (and trying to push it forward inside Amazon), I found [Zola](https://www.getzola.org) to be particularly appealing. 

## Travel map

One of the features that I was missing from my old website was a Travel Map, with all the places I have traveled and the dates, so I can know when something specific happened in my life, in Spain, or another country.

I found that the [DeepThought](https://deepthought-theme.netlify.app/docs/extended-shortcodes/#mapbox) zola theme has the integration ready, so might bring over some of that. Currently, there's a pretty static map by default, but mapbox includes very nice realistic themes if interested, which fit better with how we want to run our site.

``` html
{% if config.extra.mapbox.enabled %}
<link rel="stylesheet" href="https://api.mapbox.com/mapbox-gl-js/v2.6.1/mapbox-gl.css" integrity="sha384-oGm59HWAkwO32h2w8u0B98wKBZJwd6MbWtAJwQKCTffZjOXHXrnyv9Syjovgc+UV" crossorigin="anonymous">
{% endif %}
```

