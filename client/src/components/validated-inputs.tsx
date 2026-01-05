import { forwardRef, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { 
  ValidationPatterns, 
  VitalsConfig, 
  TextFieldConfig,
  isValidNumericInput,
  isValidBloodPressure 
} from "@shared/validation";

interface ValidatedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  error?: string;
  showError?: boolean;
  onChange?: (value: string) => void;
  onValueChange?: (value: string) => void;
}

export const NumericInput = forwardRef<HTMLInputElement, ValidatedInputProps & {
  allowDecimal?: boolean;
  min?: number;
  max?: number;
}>(({ 
  className, 
  error, 
  showError = true, 
  onChange, 
  onValueChange,
  allowDecimal = true,
  min,
  max,
  ...props 
}, ref) => {
  const [localError, setLocalError] = useState<string>("");

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
    if (allowedKeys.includes(e.key)) return;

    if (e.key === '.' && allowDecimal) {
      const currentValue = e.currentTarget.value;
      if (currentValue.includes('.')) {
        e.preventDefault();
      }
      return;
    }

    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  }, [allowDecimal]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (value === '' || isValidNumericInput(value, allowDecimal)) {
      setLocalError("");
      onChange?.(value);
      onValueChange?.(value);
    } else {
      setLocalError("Only numbers are allowed");
    }
  }, [allowDecimal, onChange, onValueChange]);

  const displayError = error || localError;

  return (
    <div className="w-full">
      <Input
        ref={ref}
        inputMode="decimal"
        className={cn(
          displayError && showError && "border-destructive focus-visible:ring-destructive",
          className
        )}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        {...props}
      />
      {showError && displayError && (
        <p className="text-xs text-destructive mt-1" data-testid="input-error">{displayError}</p>
      )}
    </div>
  );
});
NumericInput.displayName = "NumericInput";

export const IntegerInput = forwardRef<HTMLInputElement, ValidatedInputProps & {
  min?: number;
  max?: number;
}>(({ className, error, showError = true, onChange, onValueChange, min, max, ...props }, ref) => {
  const [localError, setLocalError] = useState<string>("");

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
    if (allowedKeys.includes(e.key)) return;

    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (value === '' || ValidationPatterns.integerOnly.test(value)) {
      const numValue = parseInt(value, 10);
      if (value !== '' && min !== undefined && numValue < min) {
        setLocalError(`Minimum value is ${min}`);
      } else if (value !== '' && max !== undefined && numValue > max) {
        setLocalError(`Maximum value is ${max}`);
      } else {
        setLocalError("");
      }
      onChange?.(value);
      onValueChange?.(value);
    }
  }, [min, max, onChange, onValueChange]);

  const displayError = error || localError;

  return (
    <div className="w-full">
      <Input
        ref={ref}
        inputMode="numeric"
        className={cn(
          displayError && showError && "border-destructive focus-visible:ring-destructive",
          className
        )}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        {...props}
      />
      {showError && displayError && (
        <p className="text-xs text-destructive mt-1" data-testid="input-error">{displayError}</p>
      )}
    </div>
  );
});
IntegerInput.displayName = "IntegerInput";

export const BloodPressureInput = forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({ className, error, showError = true, onChange, onValueChange, ...props }, ref) => {
    const [localError, setLocalError] = useState<string>("");

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
      const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End', '/'];
      if (allowedKeys.includes(e.key)) return;

      if (!/^[0-9]$/.test(e.key)) {
        e.preventDefault();
      }
    }, []);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      
      if (value === '' || isValidBloodPressure(value)) {
        if (value && value.includes('/')) {
          const parts = value.split('/');
          const systolic = parseInt(parts[0], 10);
          const diastolic = parseInt(parts[1], 10);
          if ((parts[0] && (systolic < 50 || systolic > 250)) || 
              (parts[1] && (diastolic < 30 || diastolic > 150))) {
            setLocalError("Enter valid BP range");
          } else {
            setLocalError("");
          }
        } else {
          setLocalError("");
        }
        onChange?.(value);
        onValueChange?.(value);
      }
    }, [onChange, onValueChange]);

    const displayError = error || localError;

    return (
      <div className="w-full">
        <Input
          ref={ref}
          inputMode="numeric"
          placeholder={VitalsConfig.bp.placeholder}
          className={cn(
            displayError && showError && "border-destructive focus-visible:ring-destructive",
            className
          )}
          onKeyDown={handleKeyDown}
          onChange={handleChange}
          {...props}
        />
        {showError && displayError && (
          <p className="text-xs text-destructive mt-1" data-testid="input-error">{displayError}</p>
        )}
      </div>
    );
  }
);
BloodPressureInput.displayName = "BloodPressureInput";

export const TextOnlyInput = forwardRef<HTMLInputElement, ValidatedInputProps & {
  allowNumbers?: boolean;
  minLength?: number;
  maxLength?: number;
  fieldType?: keyof typeof TextFieldConfig;
}>(({ 
  className, 
  error, 
  showError = true, 
  onChange, 
  onValueChange,
  allowNumbers = false,
  minLength,
  maxLength,
  fieldType,
  ...props 
}, ref) => {
  const [localError, setLocalError] = useState<string>("");
  
  const config = fieldType ? TextFieldConfig[fieldType] : null;
  const pattern = allowNumbers ? ValidationPatterns.textWithNumbers : ValidationPatterns.textOnly;

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End', ' '];
    if (allowedKeys.includes(e.key)) return;

    const allowedChars = allowNumbers 
      ? /^[a-zA-Z0-9.,;:!?'"()\-/]$/ 
      : /^[a-zA-Z.,;:!?'"()\-]$/;
    
    if (!allowedChars.test(e.key)) {
      e.preventDefault();
    }
  }, [allowNumbers]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (value === '' || pattern.test(value)) {
      const min = minLength ?? config?.minLength ?? 0;
      const max = maxLength ?? config?.maxLength ?? Infinity;
      
      if (value.length < min && min > 0) {
        setLocalError(`Minimum ${min} characters required`);
      } else if (value.length > max) {
        setLocalError(`Maximum ${max} characters allowed`);
      } else {
        setLocalError("");
      }
      onChange?.(value);
      onValueChange?.(value);
    } else {
      setLocalError(config?.errorMessage || "Invalid characters");
    }
  }, [pattern, minLength, maxLength, config, onChange, onValueChange]);

  const displayError = error || localError;

  return (
    <div className="w-full">
      <Input
        ref={ref}
        className={cn(
          displayError && showError && "border-destructive focus-visible:ring-destructive",
          className
        )}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        placeholder={config?.placeholder}
        {...props}
      />
      {showError && displayError && (
        <p className="text-xs text-destructive mt-1" data-testid="input-error">{displayError}</p>
      )}
    </div>
  );
});
TextOnlyInput.displayName = "TextOnlyInput";

export const NameInput = forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({ className, error, showError = true, onChange, onValueChange, ...props }, ref) => {
    const [localError, setLocalError] = useState<string>("");

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
      const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End', ' '];
      if (allowedKeys.includes(e.key)) return;

      if (!/^[a-zA-Z.\-']$/.test(e.key)) {
        e.preventDefault();
      }
    }, []);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      
      if (value === '' || ValidationPatterns.nameField.test(value)) {
        if (value.length > 0 && value.length < 2) {
          setLocalError("Minimum 2 characters required");
        } else if (value.length > 100) {
          setLocalError("Maximum 100 characters allowed");
        } else {
          setLocalError("");
        }
        onChange?.(value);
        onValueChange?.(value);
      }
    }, [onChange, onValueChange]);

    const displayError = error || localError;

    return (
      <div className="w-full">
        <Input
          ref={ref}
          className={cn(
            displayError && showError && "border-destructive focus-visible:ring-destructive",
            className
          )}
          onKeyDown={handleKeyDown}
          onChange={handleChange}
          placeholder="Enter name"
          {...props}
        />
        {showError && displayError && (
          <p className="text-xs text-destructive mt-1" data-testid="input-error">{displayError}</p>
        )}
      </div>
    );
  }
);
NameInput.displayName = "NameInput";

interface ValidatedTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  error?: string;
  showError?: boolean;
  onChange?: (value: string) => void;
  onValueChange?: (value: string) => void;
  allowNumbers?: boolean;
  fieldType?: keyof typeof TextFieldConfig;
}

export const TextOnlyTextarea = forwardRef<HTMLTextAreaElement, ValidatedTextareaProps>(
  ({ 
    className, 
    error, 
    showError = true, 
    onChange, 
    onValueChange,
    allowNumbers = true,
    fieldType,
    ...props 
  }, ref) => {
    const [localError, setLocalError] = useState<string>("");
    
    const config = fieldType ? TextFieldConfig[fieldType] : null;
    const pattern = allowNumbers ? ValidationPatterns.textWithNumbers : ValidationPatterns.textOnly;

    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      const max = config?.maxLength ?? 5000;
      
      if (value.length > max) {
        setLocalError(`Maximum ${max} characters allowed`);
      } else {
        setLocalError("");
      }
      onChange?.(value);
      onValueChange?.(value);
    }, [config, onChange, onValueChange]);

    const displayError = error || localError;

    return (
      <div className="w-full">
        <Textarea
          ref={ref}
          className={cn(
            displayError && showError && "border-destructive focus-visible:ring-destructive",
            className
          )}
          onChange={handleChange}
          placeholder={config?.placeholder}
          {...props}
        />
        {showError && displayError && (
          <p className="text-xs text-destructive mt-1" data-testid="textarea-error">{displayError}</p>
        )}
      </div>
    );
  }
);
TextOnlyTextarea.displayName = "TextOnlyTextarea";

export const VitalInput = forwardRef<HTMLInputElement, ValidatedInputProps & {
  vitalType: keyof typeof VitalsConfig;
}>(({ vitalType, className, error, showError = true, onChange, onValueChange, ...props }, ref) => {
  const config = VitalsConfig[vitalType];
  
  if (vitalType === 'bp') {
    return (
      <BloodPressureInput
        ref={ref}
        className={className}
        error={error}
        showError={showError}
        onChange={onChange}
        onValueChange={onValueChange}
        placeholder={config.placeholder}
        {...props}
      />
    );
  }

  const allowDecimal = vitalType === 'weight' || vitalType === 'temperature';
  const minValue = typeof config.min === 'number' ? config.min : undefined;
  const maxValue = typeof config.max === 'number' ? config.max : undefined;
  
  return (
    <NumericInput
      ref={ref}
      className={className}
      error={error}
      showError={showError}
      onChange={onChange}
      onValueChange={onValueChange}
      allowDecimal={allowDecimal}
      min={minValue}
      max={maxValue}
      placeholder={config.placeholder}
      data-testid={`input-vital-${vitalType}`}
      {...props}
    />
  );
});
VitalInput.displayName = "VitalInput";
