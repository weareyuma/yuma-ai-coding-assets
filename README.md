# Installing APM

To install APM, you can use the following command:

```bash
curl -sSL https://aka.ms/apm-unix | sh
```

or see the [installation guide](https://github.com/microsoft/apm) for more options.

# Getting started

First install this repo as a marketplace:

```bash
apm marketplace add weareyuma/yuma-ai-coding-assets
```

The marketplace is called `yuma` and you can browse any package as follows:

```bash
apm marketplace browse yuma
```

Then you can install any listed skill with

```bash
apm marketplace install <skill-name>@yuma
```

For example, install the spec-driven skills with

```bash
apm marketplace install spec-driven@yuma
```
