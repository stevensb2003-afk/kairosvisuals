"use client"

import { CheckIcon, ChevronsUpDown, Phone } from "lucide-react"
import * as React from "react"
import * as RPNI from "react-phone-number-input"
import flags from "react-phone-number-input/flags"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

type PhoneInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value"
> &
  Omit<RPNI.Props<typeof RPNI.default>, "onChange"> & {
    onChange?: (value: RPNI.Value) => void
    defaultCountry?: RPNI.Country
    country?: RPNI.Country
    international?: boolean
  }

const PhoneInput: React.ForwardRefExoticComponent<PhoneInputProps> =
  React.forwardRef<any, PhoneInputProps>(
    ({ className, onChange, ...props }, ref) => {
      return (
        <RPNI.default
          ref={ref}
          className={cn("flex", className)}
          flagComponent={FlagComponent}
          countrySelectComponent={CountrySelect}
          inputComponent={InputComponent}
          international={false}
          onChange={(value) => onChange?.(value || ("" as RPNI.Value))}
          {...props}
          // Si no hay país seleccionado y el componente no es internacional,
          // pasamos readOnly al input para bloquear el teclado móvil.
          readOnly={!props.defaultCountry && !props.country && !props.international}
        />
      )
    }
  )
PhoneInput.displayName = "PhoneInput"

const InputComponent = React.forwardRef<HTMLInputElement, any>(
  ({ className, ...props }, ref) => (
    <Input
      className={cn("rounded-e-lg rounded-s-none", className)}
      {...props}
      ref={ref}
    />
  )
)
InputComponent.displayName = "InputComponent"

type CountrySelectOption = { label: string; value: RPNI.Country }

type CountrySelectProps = {
  disabled?: boolean
  value: RPNI.Country
  onChange: (value: RPNI.Country) => void
  options: CountrySelectOption[]
}

const CountrySelect = ({
  disabled,
  value,
  onChange,
  options,
}: CountrySelectProps) => {
  const handleSelect = React.useCallback(
    (country: RPNI.Country) => {
      onChange(country)
    },
    [onChange]
  )

  return (
    <Popover modal={true}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={"outline"}
          className={cn("flex gap-1.5 rounded-e-none rounded-s-lg px-3 border-r-0")}
          disabled={disabled}
        >
          <FlagComponent country={value} countryName={value} />
          {value && (
            <span className="text-foreground/80 text-sm font-medium">
              {`+${RPNI.getCountryCallingCode(value)}`}
            </span>
          )}
          <ChevronsUpDown
            className={cn(
              "-mr-2 h-4 w-4 opacity-50",
              disabled ? "hidden" : "opacity-100"
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[300px] p-0" 
      >
        <Command>
          <CommandList>
            <ScrollArea className="h-72">
              <CommandInput placeholder="Buscar país..." />
              <CommandEmpty>No se encontró el país.</CommandEmpty>
              <CommandGroup>
                {options
                  .filter((x) => x.value)
                  .map((option) => (
                    <CommandItem
                      className="gap-2"
                      key={option.value}
                      onSelect={() => handleSelect(option.value)}
                    >
                      <FlagComponent
                        country={option.value}
                        countryName={option.label}
                      />
                      <span className="flex-1 text-sm">{option.label}</span>
                      {option.value && (
                        <span className="text-foreground/50 text-sm">
                          {`+${RPNI.getCountryCallingCode(option.value)}`}
                        </span>
                      )}
                      <CheckIcon
                        className={cn(
                          "ml-auto h-4 w-4",
                          option.value === value ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

const FlagComponent = ({ country, countryName }: RPNI.FlagProps) => {
  const Flag = flags[country]

  return (
    <span className="flex h-4 w-6 overflow-hidden rounded-sm items-center justify-center shrink-0 border border-muted/20">
      {Flag ? (
        <span className="w-full h-full object-cover">
          <Flag title={countryName} />
        </span>
      ) : (
        <Phone className="h-3 w-3 text-muted-foreground" />
      )}
    </span>
  )
}
FlagComponent.displayName = "FlagComponent"

export { PhoneInput }
