zustand-rhf-sync
---

Syncs zustand's store state with the form state in [react-hook-forms](react-hook-form.com). 

This allows form updates to immediately reflect in your store and allows the components that subscribe to your store to update based on form updates. 

Convenient if you want to use your store functions or selectors with form data.

## Install

```bash
npm install -save zustand-rhf-sync
```

Or with yarn 

```bash
yarn add zustand-rhf-sync
```

## Usage

```typescript
import { useFormWithStore } from "zustand-rhf-sync";

// use it just like useForm
// where default value is automatically populated from your store
const { register } = useFormWithStore(
    useBoundStore,
    (formData) => useBoundStore.setState({ form: formData }),
    (state) => state.formData,
    useFormOptions
)
```