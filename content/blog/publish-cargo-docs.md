+++
title = "Publish your cargo docs"
description = "A key part of a project's success is its documentation and how readily available it is. As part of this post, I guide you through the process of publishing the cargo docs of your crate to netlify, as I was doing so for rune."
date = 2023-12-16
[taxonomies]
tags = ["rust", "software"]
[extra]
toc = true
+++

As discussed on <https://github.com/CeleritasCelery/rune/issues/48>, we see valuable to publish the documentation to somewhere consumable, for future contributors to see the documentation without actually having the barrier of running `cargo doc --workspace` on their machines.

Was testing the way to publish the cargo doc output, and saw that the tracing crate is doing something very similar with netlify. Since I like netlify (have this web on there) thought that we can do an MVP with something similar to `tracing`: https://tracing-rs.netlify.app/tracing/

First, we move the core changes I have on `master` to `core` again. We want to be clean for the `docs publishing` PR. We need dependencies included as part of the builds on netlify, because we seem to need gdk and pango, as with the CI. Talking about CI, we need to only publish these changes upon push to mainline, which is kinda what netlify does by default, so we should be good there, no need to update the CI.

There are some issues with the dependencies, so I'm really interested in knowing why we have them on the rune repo either way. Do we require specific dependencies for anything? Can we gate those dependencies with features (cfg or something) to avoid this?

Since we have that limitation, it sounds like we could build a CI step to happen on push to master where we would install rustup with the dependencies, run the command ourselves and deploy the target/doc, similar to what netlify is doing. I wonder whether netlify can just deploy a directory. Let's see with the netlify github action.

``` yaml
# .github/workflows/netlify.yml
name: Build and Deploy to Netlify
on:
push:
pull_request:
jobs:
build:
runs-on: ubuntu-22.04
steps:
- uses: actions/checkout@v3

      # ( Build to ./dist or other directory... )

      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v2.0
        with:
          publish-dir: './dist'
          production-branch: master
          github-token: ${{ secrets.GITHUB_TOKEN }}
          deploy-message: "Deploy from GitHub Actions"
          enable-pull-request-comment: false
          enable-commit-comment: true
          overwrites-pull-request-comment: true
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
        timeout-minutes: 1
```

Added both the NETLIFY_AUTH_TOKEN and the NETLIFY_SITE_ID to the secrets of my fork of rune. Let's test the github action by pushing to docs.

It did publish, but since the target/doc directory has all the crates, including the \`rune\` one, we should set up a redirect from `/` to `/rune`. All the internal links should work.

As part of the same PR, I fixed all the warnings on cargo doc, making sure that the documentation is correctly published. The trick to deploy cargo doc is to deploy `target/doc` and then pair that with a redirect of the main page (configured rune-rs.netlify.app on my own account) to `/rune` which (as the main crate) has the info about the subcrates as well.

****IMPORTANT****: For this to work, you need to do the following steps. I would do the steps myself, but I imagined you would like to have control of the app itself, as the author of the project:

1.  Create a Netlify account if you don't have any.
2.  Create a new site with the Rune project on Github.
3.  ****Note down**** the site id.
4.  Change the site name to something like rune-rs, for <https://rune-rs.netlify.app> to work. I'll remove my site with the same name to avoid conflicts.
5.  Go to your profile, User Settings, Applications and Generate a No Expiry (or to be expired, although that will need changing the secrets whenever it expires again) Personal Access Token and ****note it down****.
6.  Go to the SECRETS configuration of this repo.
7.  With the site id you noted down, add the NETLIFY_SITE_ID secret.
8.  With the personal access token you noted down, add the NETLIFY_AUTH_TOKEN secret.

The site will be published on any push to `master`, no need to publish on PRs!

With that, we have a successfully published cargo docs on <https://rune-rs.netlify.app> so that other contributors can see the documentation without the barrier of running `cargo doc --workspace` manually. Here's the [PR](https://github.com/CeleritasCelery/rune/pull/50).
