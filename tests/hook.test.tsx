import "@testing-library/jest-dom";
import React, { StrictMode } from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
} from "react-hook-form";
import { create } from "zustand";
import { useFormWithStore } from "../src/hook";

type StoreState = {
  count: number;
  arr: {
    foo: string;
  }[];
  inc: () => void;
};

type FormState = {
  count: number;
  arr: {
    foo: string;
  }[];
};

describe("useSyncRHFWithStore with uncontrolled input", () => {
  const useBoundStore = create<StoreState>((set) => ({
    count: 0,
    arr: [{ foo: "foo-0" }],
    inc: () => set((state) => ({ count: state.count + 1 })),
  }));

  function Counter({
    onSubmit = () => {},
    formOptions,
    children,
  }: {
    onSubmit?: (data: any) => void;
    formOptions?: Parameters<typeof useForm<FormState>>[0];
    children?: React.ReactNode;
  }) {
    const renderCount = React.useRef(0);
    renderCount.current += 1;
    const { count, arr } = useBoundStore();
    const useFormReturn = useFormWithStore<StoreState, FormState>(
      useBoundStore,
      useBoundStore.setState,
      (state) => state,
      formOptions,
    );
    const {
      register,
      handleSubmit,
      control,
      formState: { errors },
    } = useFormReturn;

    const { fields, append, remove } = useFieldArray({
      control,
      name: "arr",
    });

    return (
      <form onSubmit={handleSubmit(onSubmit)}>
        <div data-testid="render-count">{renderCount.current}</div>
        <input
          {...register("count", {
            required: true,
            min: 0,
            valueAsNumber: true,
          })}
          data-testid="count-input"
        />
        {fields.map((field, index) => (
          <div key={field.id}>
            <input
              {...register(`arr.${index}.foo`)}
              data-testid={`arr-${index}-foo-input`}
            />
            <button
              type="button"
              onClick={() => remove(index)}
              data-testid={`arr-${index}-remove-button`}>
              delete
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => append({ foo: `foo-${fields.length}` })}
          data-testid="arr-append-button">
          append
        </button>
        <button type="submit">submit</button>
        <div>count: {count}</div>
        <div>arr: {JSON.stringify(arr)}</div>
        {errors.count && (
          <div>errors: {JSON.stringify(errors.count?.type)}</div>
        )}
        <FormProvider {...useFormReturn}>{children}</FormProvider>
      </form>
    );
  }
  beforeEach(() => {
    useBoundStore.setState({ count: 0, arr: [{ foo: "foo-0" }] });
  });
  it("input change synced to store", async () => {
    const { findByText, getByTestId } = render(
      <StrictMode>
        <Counter />
      </StrictMode>,
    );

    fireEvent.change(getByTestId("count-input"), {
      target: { value: "5" },
    });

    await findByText("count: 5");
  });

  it("store change synced to input", async () => {
    let formData: any = {};

    const { findByText, getByTestId, getByText } = render(
      <StrictMode>
        <Counter
          onSubmit={(data: any) => {
            formData = data;
          }}
        />
      </StrictMode>,
    );

    act(() => {
      useBoundStore.setState({ count: 5 });
    });

    await findByText("count: 5");
    expect(getByTestId("count-input")).toHaveValue("5");

    fireEvent.click(getByText("submit"));

    await waitFor(() => {
      expect(formData.count).toBe(5);
    });
  });

  it("store increment synced to input", async () => {
    const { findByText, getByTestId } = render(
      <StrictMode>
        <Counter />
      </StrictMode>,
    );

    act(() => {
      useBoundStore.getState().inc();
    });

    await findByText("count: 1");
    expect(getByTestId("count-input")).toHaveValue("1");
  });

  it("whole form reset synced to store", async () => {
    let formData: any = {};

    function Resetter() {
      const { reset } = useFormContext<FormState>();
      return (
        <button onClick={() => reset({ count: 10 })} data-testid="reset-button">
          reset
        </button>
      );
    }
    const { findByText, getByTestId } = render(
      <StrictMode>
        <Counter onSubmit={(data: any) => (formData = data)}>
          <Resetter />
        </Counter>
      </StrictMode>,
    );

    act(() => {
      useBoundStore.setState({ count: 5 });
      fireEvent.click(screen.getByText("submit"));
    });

    await waitFor(() => {
      expect(formData.count).toBe(5);
    });

    fireEvent.click(getByTestId("reset-button"));
    fireEvent.click(screen.getByText("submit"));

    await waitFor(() => {
      expect(formData.count).toBe(10);
    });

    await findByText("count: 10");
  });

  it("single field reset synced to store", async () => {
    let formData: any = {};

    function Resetter() {
      const { resetField } = useFormContext<FormState>();
      return (
        <button
          onClick={() => resetField("count", { defaultValue: 10 })}
          data-testid="reset-button">
          reset
        </button>
      );
    }

    const { findByText, getByTestId } = render(
      <StrictMode>
        <Counter onSubmit={(data: any) => (formData = data)}>
          <Resetter />
        </Counter>
      </StrictMode>,
    );

    act(() => {
      useBoundStore.setState({ count: 5 });
      fireEvent.click(getByTestId("reset-button"));
      fireEvent.click(screen.getByText("submit"));
    });

    await waitFor(() => {
      expect(formData.count).toBe(10);
    });

    await findByText("count: 10");
  });

  it("setValues synced to store", async () => {
    let formData: any = {};

    function Setter() {
      const { setValue } = useFormContext<FormState>();
      return (
        <button onClick={() => setValue("count", 10)} data-testid="set-button">
          set
        </button>
      );
    }

    const { findByText, getByTestId } = render(
      <StrictMode>
        <Counter onSubmit={(data: any) => (formData = data)}>
          <Setter />
        </Counter>
      </StrictMode>,
    );

    act(() => {
      useBoundStore.setState({ count: 5 });
      fireEvent.click(getByTestId("set-button"));
      fireEvent.click(screen.getByText("submit"));
    });

    await waitFor(() => {
      expect(formData.count).toBe(10);
    });

    await findByText("count: 10");
  });

  it("store change synced to input triggering revalidation", async () => {
    const { getByTestId } = render(
      <StrictMode>
        <Counter />
      </StrictMode>,
    );

    // set input to invalid value
    fireEvent.change(getByTestId("count-input"), {
      target: { value: "" },
    });

    await waitFor(() => {
      expect(screen.queryByText('errors: "required"')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("submit"));

    await waitFor(() => {
      expect(screen.getByText('errors: "required"')).toBeInTheDocument();
    });

    act(() => {
      // set store to valid value
      useBoundStore.setState({ count: 5 });
    });

    await waitFor(() => {
      expect(screen.queryByText('errors: "required"')).not.toBeInTheDocument();
    });
  });

  it("store change triggers validation if validation mode is onTouched", async () => {
    const { getByText, queryByText } = render(
      <StrictMode>
        <Counter formOptions={{ mode: "onTouched" }} />
      </StrictMode>,
    );

    act(() => {
      // set store to invalid value
      useBoundStore.setState({ count: -5 });
    });

    await waitFor(() => {
      expect(getByText('errors: "min"')).toBeInTheDocument();
    });

    act(() => {
      // set store to valid value
      useBoundStore.setState({ count: 5 });
    });

    await waitFor(() => {
      expect(queryByText('errors: "min"')).not.toBeInTheDocument();
    });
  });

  it("field array append synced to store", async () => {
    const { getByTestId } = render(
      <StrictMode>
        <Counter />
      </StrictMode>,
    );

    fireEvent.click(getByTestId("arr-append-button"));

    await waitFor(() => {
      expect(getByTestId("arr-1-foo-input")).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(useBoundStore.getState().arr).toHaveLength(2);
    });
  });

  it("field array remove synced to store", async () => {
    const { getByTestId } = render(
      <StrictMode>
        <Counter />
      </StrictMode>,
    );

    fireEvent.click(getByTestId("arr-append-button"));
    fireEvent.click(getByTestId("arr-0-remove-button"));

    await waitFor(() => {
      expect(useBoundStore.getState().arr).toHaveLength(1);
      expect(useBoundStore.getState().arr[0].foo).toBe("foo-1");
    });
  });

  it("store change synced to field array", async () => {
    const { findByText, getByTestId } = render(
      <StrictMode>
        <Counter />
      </StrictMode>,
    );

    act(() => {
      useBoundStore.setState({ arr: [{ foo: "foo-0" }, { foo: "foo-1" }] });
    });

    await findByText('arr: [{"foo":"foo-0"},{"foo":"foo-1"}]');
    expect(getByTestId("arr-0-foo-input")).toHaveValue("foo-0");
    expect(getByTestId("arr-1-foo-input")).toHaveValue("foo-1");
  });

  it("store changes to same value does not trigger rerender", async () => {
    const { getByTestId } = render(
      <StrictMode>
        <Counter />
      </StrictMode>,
    );

    act(() => {
      expect(getByTestId("render-count")).toHaveTextContent("3");
      useBoundStore.setState({ count: 0 });
      expect(getByTestId("render-count")).toHaveTextContent("3");

      fireEvent.change(getByTestId("count-input"), {
        target: { value: "0" },
      });
      expect(getByTestId("render-count")).toHaveTextContent("3");

      useBoundStore.setState({ arr: [{ foo: "foo-0" }] });
      expect(getByTestId("render-count")).toHaveTextContent("3");
    });
  });
});
