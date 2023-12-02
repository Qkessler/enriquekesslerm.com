+++
title = "Setting up the Rune project for success"
description = "The Rune project has been running successfully without CI for more than a year now. I see the next steps for the project as needing to introduce contributors to the codebase. For that, a robust CI pipeline is key to avoid any regressions on the master commits or PRs."
date = 2023-12-02
[taxonomies]
tags = ["emacs", "rust", "software"]
[extra]
toc = true
+++

## Introduction

After very recently syncing with Troy, the owner of the Rune project (you can check my first contribution blog post [here](@/blog/bye-lazy-static-welcome-once-cell.md)), we were discussing about the next (immediate) steps for the project, and overall my next contribution. Here's my proposal:

> Step by step, we need CI for pull requests and then we can potentially work on simplifying and completing the backlog of issues we have. With a prioritized backlog, we can call for contributions on both Emacs and Rust’s subreddits. What do you think?
> 
> After the CI, I can build something with async rust (probably file io can benefit from it), and make sure to measure it with benchmarks (criterion or cargo benchmark). Those benchmarks could potentially be added to CI once we are happy with them, and make sure we don’t regress performance with pull requests or commits.
> 
> Looking forward to next steps,
> Best,
> Quique.

With that, here's the first step: CI for the Rune project, buckle up!

## Stepping stones

I was aware that Jon Gjenset (@jonhoo) did a super nice video explaining his recommendation for CI that should run on lib/bin crates ([ref](https://www.youtube.com/watch?v=xUH-4y92jPg&t=491s)). That video goes through an overview of some files of the project [rust-ci-conf](https://github.com/jonhoo/rust-ci-conf/), which is a set of Github Actions workflows to cover the bare minimum for crates: stepping stones to a great CI pipeline for our Rune project.

With that, I used the project as a blueprint of what CI could look like and started modifying the workflows with the specific requirements of the `rune` crate. From the top of my head:

-   Rune is a binary, not a library, so we can't run doctests on it.
-   Rune has the rust-toolchain set to `beta` and that broke CI and is not common in other popular crates.
-   Rune does not have any feature gates so `cargo-hack` wouldn't do us any good.
-   Rune does not run correctly on Windows (yet), so it wouldn't make sense to run CI on something we don't support yet.
-   Rune uses `unsafe` code, which means we need to care about safety and ensure any change is sanitized and avoids any Undefined Behaviour.

Staring from those requirements, I modified the [DOCS.md file of the .github folder](https://github.com/Qkessler/rune/blob/master/.github/DOCS.md?plain=1#L1) with the intention of documenting possible improvement points I see on CI, with the intention of future contributors iterating on the current CI pipeline.

## Potential improvements

### cargo-hack
> `cargo-hack` checks combinations of feature flags to ensure that features are all additive which is required for feature unification.

[source](https://github.com/jonhoo/rust-ci-conf/blob/main/.github/workflows/check.yml#L77)

As we don't currently have any meaningful feature gates.

### scheduled
> Run scheduled (rolling) jobs on a nightly basis, as your crate may break independently of any given PR. E.g., updates to rust nightly and updates to this crates dependencies. See check.yml for information about how the concurrency cancelation and workflow triggering works

[source](https://github.com/jonhoo/rust-ci-conf/blob/main/.github/workflows/scheduled.yml#L1)

As we don't run on nightly, we don't really need to check whether nightly breaks our builds. A potential argument for adding this could be that we are running nightly for the CI, and we could break the CI from nightly builds. I propose revisiting adding the `scheduled.yml` linked above if that's the case.

### loom
> Loom is a testing tool for concurrent Rust code. It runs a test many times, permuting the possible concurrent executions of that test under the C11 memory model. It uses state reduction techniques to avoid combinatorial explosion.

[source](<https://crates.io/crates/loom>)

Loom is great and it's backed by Tokio, but it would mean a bigger investment in making the threads we use be loom specific. Definitely something to iterate on, as we get onto Async Emacs.

### codecov.io
> Enhance Your Testing the Codecov Way: Codecov is the all-in-one code coverage reporting solution for any test suite — giving developers actionable insights to deploy reliable code with confidence.

[source](<https://about.codecov.io>), [repo of Github Action](<https://github.com/codecov/codecov-action>)

If we want to add a badge or have nice reports on coverage, we could investigate CodeCov. It requires a token that should be added to the secrets of the repository: `CODECOV_TOKEN`.

### Windows tests
```yaml
matrix:
    os: [macos-latest] # REVIEW: We could add windows-latest here.
```

As of today, we don't support Windows, or at least the tests are failing. We can iterate on this and if we feel Windows should be supported in the near feature, we can add `windows-latest` to run CI on it.

### Doctests on binary crates

As suggested by [issue](https://github.com/rust-lang/rust/issues/50784), doctests won't currently run on Binary creates. I don't see anything particularly wrong with running doctests on binary crates. Some of the argumenst include that "Why would a binary be documented?". Documentation is not only useful for consumers of the library, but rather also internal developers that are maintaining it, looking for better understanding of the binary crate. It's key that developers onboarding into the project have the material to have a swift ramp-up process, to move the project forward. 

Once the issue above is stabilized, we can add the following to the test.yml fire:

```yaml
-   name: cargo test --doc
    run: cargo test --locked --all-features --doc
```

## Iterative process

The overarching theme with this contribution is: **I see CI as an iterative process, and I'm sure we'll be changing it in the future**. This acts as a good start, and opens the project to possible issues it may have, that CI now catches (say, dependency issue, as we see running `cargo test` with `-Zminimal-versions`).

I see this first PR as not fixing all the issues with the repository, but rather creating the stepping stones to fix them in the next commits. Every commit that includes this PR has been tested with the CI changes, iterating on the process. I'm open to rebasing the commits if needed, but it's useful to see the iteration process to arrive to a CI that fits the project's needs.

## Conclusion

I was able to get a successfully configured CI pipeline for the Rune project, and propose additional improvements that we can discuss on the PR for it. I see CI as an iterative process, and I bet it's something we modify sooner than we think. As suggested by the step by step game plan above, next steps include:

-   Run the runtime directly on Emacs, and add it to the CI.
-   Create a benchmark suite to avoid any regressions on performance, and add it to the CI.
-   Start playing with async code, where `loom` could potentially fit (and add it to the CI).

Lots of work left, really excited about the future!

P.S: Here's the PR link: [#35](https://github.com/CeleritasCelery/rune/pull/35)
