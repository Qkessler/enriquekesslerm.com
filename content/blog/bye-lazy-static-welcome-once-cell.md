+++
title = "Bye lazy_static, Welcome once_cell!"
description = "Contributing to the rune project (Rust Under Emacs) to change the lazy_static usage to the newly standardized once_cell crate, now std::sync::OnceLock and std::sync::LazyLock."
date = 2023-11-26
[taxonomies]
tags = ["emacs", "rust", "software"]
[extra]
toc = true
+++

## Introduction

Very recently I have become really interested in a project called [rune](https://github.com/CeleritasCelery/rune) (**R**ust **Un**der **E**macs, love the name), which in nature creates a Rust Virtual Machine to run Emacs on. The author of the project has written in detail about pros and cons of using Rust [here](https://coredumped.dev/2023/01/17/design-of-emacs-in-rust/), for avid readers!

In this post, I plan to contribute to the project by migrating all the usages of the late `lazy_static` to the newer alternative `once_cell`. `once_cell` has the benefit of being macro-less and being included in the standard library, as of 1.70 (there's nice documentation in the [module](https://doc.rust-lang.org/std/cell/index.html)).

Since it's included in the standard library, I thought we could just use that, but then I thought back to the project initiative: do we need to support a minimal Rust version, say running on old devices? Quite possible **not**, as the project is not yet in production (0.1.0 version, though I don't think we are following [semver](https://semver.org/)) and it won't be for a while. I don't find locking ourselves into a `once_cell` dependency is the right play, but rather, use the std version.

## Minimal Stable Rust Version

Nevertheless, for the sake of completion, I wanted to verify the minimal Rust version we support in the rune repo. For that, we can use the command provided by the [cargo-msrv crate](https://foresterre.github.io/cargo-msrv/): 

``` shell
>  cargo msrv
│     Checking fluent-syntax v0.11.0                                                     │
│     Checking fluent-bundle v0.15.2                                                     │
│    Compiling quote-use-macros v0.7.2                                                   │
│     Checking tracing v0.1.40                                                           │
│     Checking druid v0.8.3                                                              │
│    Compiling quote-use v0.7.2                                                          │
│    Compiling attribute-derive-macro v0.6.1                                             │
│    Compiling attribute-derive v0.6.1                                                   │
│ Compiling get-size-derive v0.1.3                                                       │
│ (https://github.com/CeleritasCelery/get-size.git?branch=boxed_slice_fix#e0e9377d)      │
│ Checking get-size v0.1.4                                                               │
│ (https://github.com/CeleritasCelery/get-size.git?branch=boxed_slice_fix#e0e9377d)      │
│     Checking text-buffer v0.1.0 (/Users/enrikes/Documents/rune/crates/text-buffer)     │
│ error[E0658]: use of unstable library feature 'is_some_and'                            │
│    --> src/buffer.rs:130:29                                                            │
│     |                                                                                  │
│ 130 |         |name: &str| ignore.is_some_and(|x| x == name) ||                        │
│ !buffer_list.contains_key(name);                                                       │
│     |                             ^^^^^^^^^^^                                          │ │     |                                                                                  │
│ = note: see issue #93050 <https://github.com/rust-lang/rust/issues/93050> for more     │
│ information                                                                            │
│                                                                                        │
│ For more information about this error, try `rustc --explain E0658`.                    │
│ error: could not compile `rune` due to previous error                                  │
└────────────────────────────────────────────────────────────────────────────────────────┘
Finished The MSRV is: 1.70.0   ███████████████████████████████████████████████ 00:15:22
```

Good to see, the Minimum Stable Rust Version is the 1.70.0, **which includes std::sync::OnceLock** (If you are curious about the error above, the API `is_some_and` has been stabilized in [1.70.0](https://doc.rust-lang.org/stable/std/option/enum.Option.html#method.is_some_and) as well).

# Investigation

With that, we'll move forward with OnceLock (Sync version of OnceCell), but pretty much the same properties apply:

> OnceCell<T> is somewhat of a hybrid of Cell and RefCell that works for values that typically only need to be set once. This means that a reference &T can be obtained without moving or copying the inner value (unlike Cell) but also without runtime checks (unlike RefCell). However, its value can also not be updated once set unless you have a mutable reference to the OnceCell.
> 
> OnceCell provides the following methods:
> 
> -   get: obtain a reference to the inner value
> -   set: set the inner value if it is unset (returns a Result)
> -   get_or_init: return the inner value, initializing it if needed
> -   get_mut: provide a mutable reference to the inner value, only available if you have a mutable reference to the cell itself.
> 
> The corresponding Sync version of OnceCell<T> is OnceLock<T>

[source](https://doc.rust-lang.org/stable/std/cell/index.html)

The first change I plan to make to the code base is the [buffer.rs](https://github.com/CeleritasCelery/rune/blob/master/src/buffer.rs#L1), not part of core. **REVIEW**: I wonder whether as a follow-up we can consider moving the code around to avoid having similar files without their own modules.

``` rust
lazy_static! {
    static ref BUFFERS: Mutex<HashMap<String, &'static LispBuffer>> =
        Mutex::new(HashMap::default());
}

// versus the OnceLock version.

static BUFFERS: OnceLock<Mutex<HashMap<String, &'static LispBuffer>>> = OnceLock::new();
```

As you'll see, we are not initializing the value here, and there isn't really an API to do so in the std, while there was on once_cell. If we wanted to hold the value across the different modules, we could potentially initialize it on main.rs and then access its value across the different functions. Don't know whether context here is that, or rather the context of the function, say all the variables at the time of execution (global set with `setq`, and locals created with `let*` for example).

Interesting, checking the [Context struct](https://github.com/CeleritasCelery/rune/blob/master/src/core/gc/context.rs#L28), we are using std::cell to hold the vector of `OwnedObject`, which makes me think whether the `lazy_static!` usage is just due to old code that wasn't ported to the new APIs. Right, that's not the case, the `git blame` command shows that the `lazy_static!` macro was used in 2023. Since we don't have the LazyLock API stabilized yet ([issue tracker](https://github.com/rust-lang/rust/issues/109736)), we'll have to think of an ergonomic way to initialize the BUFFERS static:

1.  We could initialize it in main.rs and then consume it, although we would kinda using the BUFFERS static as a global variable, and that means that all the modules would be aware of it, which is probably not the right solution.
2.  We could initialize it on each of the `lock()` usages, which is kinda repeating the initialization part.
3.  We could have a helper function on buffer.rs that gets or inits the BUFFERS static.

Opting for three, created this helper function:

``` rust
/// Helper function to avoid calling `get_or_init` on each of the calls to `lock()` on the Mutex.
///
/// TODO: Once [`LazyLock`] is stabilized, this can be changed to initializing on the LazyLock::new() method.
/// Stabilization tracker: https://github.com/rust-lang/rust/issues/109736
fn buffers() -> &'static Mutex<HashMap<String, &'static LispBuffer>> {
    BUFFERS.get_or_init(|| Mutex::new(HashMap::default()))
}
```

Did something very similar for [data.rs](https://github.com/CeleritasCelery/rune/blob/master/src/data.rs#L20). With that, we are only missing the complex changes for the `INTERNED_SYMBOLS` ([ref](https://github.com/CeleritasCelery/rune/blob/master/build.rs#L231)). This is great, because it's making me dive deeper into why we are using x or y in different files. In this case, let's dive deep into the build.rs [file](https://github.com/CeleritasCelery/rune/blob/master/build.rs#L231). We seem to be working with nightly a lot. Let's message the owner and see what he thinks. If he's good with it, we could just use `LazyLock` instead of helper methods on buffer.rs and data.rs.

# build.rs

I was trying to understand why we include everything we generate with the build.rs file using the `include!` macro, and I was pointed to <https://doc.rust-lang.org/cargo/reference/build-scripts.html#outputs-of-the-build-script>.

I don't see that we are actually running the `println!` macros that I'm adding inside the build.rs file when running `cargo run -- --load --repl`. I wonder when is that build.rs file running. Searching around, I see that because of [this issue](https://github.com/rust-lang/cargo/issues/985), `println!` won't run anything as it's used to communicate with cargo to run specific cargo commands on it ([ref](https://github.com/rust-lang/cargo/issues/985#issuecomment-1071667472)). A workaround of this is to use `println!("cargo:warning={}", ...)` we'll see the output. From that debugging output, I understand that:

> The build.rs script is used on rune to pull all the functions created for FFI using the #[defun] macro. From that macro, we take the lisp name and the contents and define the outputs for emacs to consume.

Here's the output of my prints:

``` shell
warning: rune@0.1.0: Reading "src/emacs.rs"
warning: rune@0.1.0: name between predicates "kill_emacs"
warning: rune@0.1.0: lisp_name: kill-emacs
warning: rune@0.1.0: Reading "src/reader.rs"
warning: rune@0.1.0: Reading "src/interpreter.rs"
warning: rune@0.1.0: name between predicates "eval"
warning: rune@0.1.0: lisp_name: eval
warning: rune@0.1.0: Reading "src/threads.rs"
warning: rune@0.1.0: name between predicates "go"
warning: rune@0.1.0: lisp_name: go
```
Basically, we read through the files and build all the defuns, but also the `defsym` and the `defvar` (ref: <https://github.com/CeleritasCelery/rune/blob/master/build.rs#L103-L110>). For the defsym, wanted to understand what they are a bit further. Added the print for [all_defsym](https://github.com/CeleritasCelery/rune/blob/master/build.rs#L143):

``` shell
warning: rune@0.1.0: [("KW_TEST", None), ("KW_DOCUMENTATION", None), ("MD5", None), ("SHA1", None), ("SHA224", None), ("SHA256", None), ("SHA384", None), ("SHA512", None), ("MANY", None), ("INTEGER", None), ("SYMBOL", None), ("COMPILED_FUNCTION", None), ("HASH_TABLE", None), ("BUFFER", None), ("SUBR", None), ("FUNCTION", None), ("QUOTE", None), ("MACRO", None), ("UNQUOTE", Some("\",\"")), ("SPLICE", Some("\",@\"")), ("BACKQUOTE", Some("\"`\"")), ("AND_OPTIONAL", Some("\"&optional\"")), ("AND_REST", Some("\"&rest\"")), ("LAMBDA", None), ("CLOSURE", None), ("CONDITION_CASE", None), ("UNWIND_PROTECT", None), ("SAVE_EXCURSION", None), ("SAVE_CURRENT_BUFFER", None), ("WHILE", None), ("INLINE", None), ("PROGN", None), ("PROG1", None), ("PROG2", None), ("SETQ", None), ("DEFCONST", None), ("COND", None), ("LET", None), ("LET_STAR", Some("\"let*\"")), ("IF", None), ("AND", None), ("OR", None), ("INTERACTIVE", None), ("CATCH", None), ("THROW", None), ("ERROR", None), ("DEBUG", None), ("VOID_VARIABLE", None)]
```

We seem to be defining them on different files, here's eval.rs:

``` rust
defsym!(FUNCTION);
defsym!(QUOTE);
defsym!(MACRO);
defsym!(UNQUOTE, ",");
defsym!(SPLICE, ",@");
```

They seem to be symbols, probably for use on the different functions that we create. Don't think I should dive deeper there, won't work on it for now.

Let's start with the build.rs changes for once_cell, now that we know how that file will be created on the `OUT_DIR`, after reading its code and the rust documentation. I'm kinda split between using the unstable features or not. I would love the confirmation from the core maintainer.

If we were to use the unstable `lazy_cell`, we can just use the initialization, which is more ergonomic, removing helper methods, which could prove tricky for the statics on the build.rs file: [INTERNED_SYMBOLS](https://github.com/CeleritasCelery/rune/blob/master/build.rs#L232)

``` rust
writeln!(
    f,
    "
use std::sync::LazyLock;
pub(crate) static INTERNED_SYMBOLS: LazyLock<Mutex<ObjectMap>> = LazyLock::new(|| Mutex::new({{
    let size: usize = {symbol_len};
    let mut map = SymbolMap::with_capacity(size);
    sym::init_symbols(&mut map);
    ObjectMap {{
        map,
        block: Block::new_global(),
    }}
}}));
"
```

With `LazyLock`, the callers wouldn't have to call `get` on the OnceLock, and instead use the methods of the content directly, since by nature, **they can assume it has been initialized**. 

I was pretty happy with the simplification, since it removes the forced initialization + comment on the [main.rs file](https://github.com/CeleritasCelery/rune/blob/master/src/main.rs#L47) and **removes the lazy_static dependency from the code base**:

```diff
 float-cmp = "0.9.0"
 fn_macros = { version = "0.1.0", path = "fn_macros" }
 hostname = "0.3.1"
-lazy_static = "1.4.0"
 memoffset = "0.8.0"
 num_enum = "0.5.11"
 paste = "1.0.12"
```

