import { useEffect, useRef } from "react";
import {
  DefaultValues,
  FieldValues,
  Path,
  UseFormProps,
  UseFormReturn,
  useForm,
} from "react-hook-form";
import { StoreApi, UseBoundStore } from "zustand";
import { deepCloneWithoutFunctions, deepCompareDifferences } from "./utils";

/**
 * Syncs a zustand store (or part of a zustand store) with the form state in react-hook-forms
 *
 * @param useStore The zustand store that you're syncing with
 * @param storeSetter The setter function for the portion of the store that you're syncing with (similar to the handleSubmit function)
 * @param storeSelector The selector function for the portion of the store that you're syncing with (usually the defaultValues passed to useForm)
 * @param useFormResult The return value of useForm from react-hook-form
 */
export function useSyncRHFWithStore<TStore, TFieldValues extends FieldValues>(
  useStore: UseBoundStore<StoreApi<TStore>>,
  storeSetter: (formValue: TFieldValues) => void,
  storeSelector: (state: TStore) => TFieldValues,
  {
    handleSubmit,
    watch,
    setValue,
    trigger,
    reset,
    getValues,
    formState,
  }: UseFormReturn<TFieldValues>,
  mode: UseFormProps<TFieldValues>["mode"] = "onSubmit",
  reValidateMode: UseFormProps<TFieldValues>["reValidateMode"] = "onChange",
): void {
  const mutex = useRef(false);

  // refs that are ignored by useEffect
  const storeSetterRef = useRef(storeSetter);
  const storeSelectorRef = useRef(storeSelector);
  const isSubmittedRef = useRef(formState.isSubmitted);
  const setValueRef = useRef(setValue);
  const resetRef = useRef(reset);
  const triggerRef = useRef(trigger);
  const getValuesRef = useRef(getValues);

  storeSetterRef.current = storeSetter;
  storeSelectorRef.current = storeSelector;
  isSubmittedRef.current = formState.isSubmitted;
  setValueRef.current = setValue;
  resetRef.current = reset;
  triggerRef.current = trigger;
  getValuesRef.current = getValues;

  // syncs form to store
  useEffect(() => {
    const formWatcher = watch((data) => {
      if (!mutex.current) {
        mutex.current = true;
        storeSetterRef.current({
          ...storeSelectorRef.current(useStore.getState()),
          ...data,
        });
        mutex.current = false;
      }
    });
    return () => formWatcher.unsubscribe();
  }, [handleSubmit, useStore, watch]);

  // syncs store to form
  useEffect(() => {
    return useStore.subscribe((state) => {
      if (!mutex.current) {
        mutex.current = true;
        const changes = deepCompareDifferences(
          storeSelectorRef.current(state),
          getValuesRef.current(),
        );
        const shouldValidate = !!(
          (!isSubmittedRef.current && mode !== "onSubmit") ||
          (isSubmittedRef.current && reValidateMode !== "onSubmit")
        );
        changes.forEach(([path, newValue]) => {
          if (path === "") {
            resetRef.current(newValue, {
              keepDirty: true,
              keepErrors: true,
              keepTouched: true,
            });
            return;
          }
          setValueRef.current(path, newValue, {
            shouldDirty: true,
            shouldTouch: true,
          });
        });
        // trigger validation after all values have been set
        if (shouldValidate) {
          if (changes.some(([path]) => path === "")) {
            triggerRef.current();
          } else if (changes.length > 0) {
            triggerRef.current(
              changes
                .map(([path]) => path)
                .filter((path) => path !== "") as Path<TFieldValues>[],
            );
          }
        }
        mutex.current = false;
      }
    });
  }, [mode, reValidateMode, useStore]);
}

/**
 * react-hook-form's useForm, but keeps the form state in sync with a zustand store
 *
 * This allows you to use react-hook-form with a zustand store, and have the form state be kept in sync with the store.
 *
 * By default, the form is initialized with the values from the store.
 *
 * @param useStore The zustand store that you're syncing with
 * @param storeSetter The setter function for the portion of the store that you're syncing with (similar to the handleSubmit function)
 * @param storeSelector The selector function for the portion of the store that you're syncing with (usually the defaultValues passed to useForm)
 * @param useFormOptions The options passed to useForm
 * @returns The return value of useForm from react-hook-form
 */
export function useFormWithStore<
  TStore,
  TFieldValues extends FieldValues,
  TContext = any,
>(
  useStore: UseBoundStore<StoreApi<TStore>>,
  storeSetter: (values: TFieldValues) => void,
  storeSelector: (state: TStore) => TFieldValues,
  useFormOptions?: UseFormProps<TFieldValues, TContext>,
): UseFormReturn<TFieldValues, TContext> {
  useFormOptions = {
    defaultValues: deepCloneWithoutFunctions(
      storeSelector(useStore.getState()),
    ) as unknown as DefaultValues<TFieldValues>,
    ...useFormOptions,
  };

  const { mode, reValidateMode } = useFormOptions;
  const useFormReturn = useForm<TFieldValues, TContext>(useFormOptions);
  useSyncRHFWithStore(
    useStore,
    storeSetter,
    storeSelector,
    useFormReturn,
    mode,
    reValidateMode,
  );
  return useFormReturn;
}
