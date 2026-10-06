> [!IMPORTANT]
> This repository has moved to the Yuma GitHub Enterprise: https://github.com/yuma-lln/yuma-ai-coding-assets
>
> It is an internal repository, so you need to be signed in with your Yuma Enterprise account (the one ending in `_yuma`). This copy is archived and no longer updated. To keep receiving updates, register the new location:
>
> ```bash
> apm marketplace add yuma-lln/yuma-ai-coding-assets
> ```

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
apm install <skill-name>@yuma
```

For example, install the spec-driven skills with

```bash
apm install spec-driven@yuma
```

# Maintenance

Regenerate the root marketplace package list after adding or removing a package:

```bash
uv run scripts/update_root_apm.py
```

Check whether the list is current without writing changes:

```bash
uv run scripts/update_root_apm.py --check
```

Always follow up with

```bash
apm pack
```

which will generate `.claude-plugin/`.
