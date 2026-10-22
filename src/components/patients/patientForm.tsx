'use client'
import React, { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation';
import { Controller, useForm, type Control, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import type { Patient } from '@/lib/db/schema';
import { BLOOD_TYPES, PERSONAL_FIELDS, patientSchema, type PatientFormData } from '@/lib/validations/patient';
import { createPatient, updatePatient } from '@/lib/actions/patient';
import { categoryFromBirthDate } from '@/lib/patient-age';

interface PatientFormProps {
  trigger: React.ReactElement;
  initialData?: Patient;
}

type Tab = 'personal' | 'medical';

// Valorile inițiale: din pacientul existent (editare) sau goale (pacient nou)
function toFormValues(patient?: Patient): PatientFormData {
  return {
    firstName: patient?.firstName ?? '',
    lastName: patient?.lastName ?? '',
    idnp: patient?.idnp ?? '',
    phone: patient?.phone ?? '',
    email: patient?.email ?? '',
    birthDate: patient?.birthDate ?? '',
    gender: patient?.gender ?? '',
    address: patient?.address ?? '',
    category: patient?.category ?? 'adult',
    status: patient?.status ?? 'activ',
    bloodType: (patient?.bloodType as PatientFormData['bloodType']) ?? '',
    alergie: patient?.alergie ?? '',
    chronicDiseases: patient?.chronicDiseases ?? '',
    currentMedications: patient?.currentMedications ?? '',
    notes: patient?.notes ?? '',
  };
}

export const PatientForm = ({ trigger, initialData }: PatientFormProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('personal');
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { register, control, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: toFormValues(initialData),
  });

  // La fiecare deschidere pornim de la datele actuale ale pacientului și de pe primul tab
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      reset(toFormValues(initialData));
      setTab('personal');
      setErrorMessage('');
    }
    setOpen(isOpen);
  };

  const onSubmit = async (data: PatientFormData) => {
    setErrorMessage('');
    try {
      const result = initialData ? await updatePatient(initialData.id, data) : await createPatient(data);
      if (!result.success) {
        setErrorMessage(result.error ?? '');
        return;
      }
      setSuccess(true);
      // Pacient nou pe pagina listei: ștergem căutarea și filtrele din URL (?q, ?status, ?page),
      // altfel pacientul abia creat poate fi ascuns de o căutare rămasă de dinainte
      if (!initialData && pathname === '/pacienti') {
        router.replace('/pacienti');
      }
      toast.add({
        title: initialData ? 'Pacient actualizat' : 'Pacient adăugat',
        description: `${data.lastName} ${data.firstName}`,
        type: 'success',
      });
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
      }, 300);
    } catch {
      setErrorMessage('A apărut o eroare, încearcă mai târziu');
    }
  };

  // Dacă validarea a eșuat pe un câmp de pe celălalt tab, mergem acolo ca utilizatorul să vadă eroarea
  const onInvalid = (formErrors: FieldErrors<PatientFormData>) => {
    const hasPersonalError = PERSONAL_FIELDS.some((field) => field in formErrors);
    setTab(hasPersonalError ? 'personal' : 'medical');
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger}></DialogTrigger>
      <DialogContent className='sm:max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editează pacientul' : 'Pacient nou'}
          </DialogTitle>
          <DialogDescription>
            {initialData ? `${initialData.lastName} ${initialData.firstName}` : 'Câmpurile marcate cu * sunt obligatorii'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className='flex flex-col gap-4'>
          <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
            <TabsList className='w-full'>
              <TabsTrigger value='personal'>Date personale</TabsTrigger>
              <TabsTrigger value='medical'>Date medicale</TabsTrigger>
            </TabsList>

            {/* keepMounted: câmpurile tab-ului ascuns rămân în pagină, deci își păstrează valorile */}
            <TabsContent value='personal' keepMounted className='flex flex-col gap-4 pt-2'>
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <FormField label='Nume' required error={errors.lastName?.message}>
                  <Input id='lastName' placeholder='Popescu' {...register('lastName')} />
                </FormField>
                <FormField label='Prenume' required error={errors.firstName?.message}>
                  <Input id='firstName' placeholder='Ion' {...register('firstName')} />
                </FormField>
                <FormField label='IDNP' required error={errors.idnp?.message}>
                  <Input id='idnp' inputMode='numeric' maxLength={13} placeholder='2000000000000' {...register('idnp')} />
                </FormField>
                <FormField label='Telefon' required error={errors.phone?.message}>
                  <Input id='phone' type='tel' inputMode='tel' placeholder='+37369000000' {...register('phone')} />
                </FormField>
                <FormField label='Email' error={errors.email?.message}>
                  <Input id='email' type='email' placeholder='pacient@mail.com' {...register('email')} />
                </FormField>
                <FormField label='Data nașterii' error={errors.birthDate?.message}>
                  <Input
                    id='birthDate'
                    type='date'
                    {...register('birthDate', {
                      // Completăm automat categoria (copil / adult) din vârstă; rămâne editabilă
                      onChange: (event) => {
                        const category = categoryFromBirthDate(event.target.value);
                        if (category) setValue('category', category);
                      },
                    })}
                  />
                </FormField>
                <SelectField
                  control={control}
                  name='gender'
                  label='Sex'
                  placeholder='Alege'
                  options={[{ value: 'M', label: 'Masculin' }, { value: 'F', label: 'Feminin' }]}
                />
                <SelectField
                  control={control}
                  name='category'
                  label='Categorie'
                  options={[{ value: 'adult', label: 'Adult' }, { value: 'copil', label: 'Copil' }]}
                />
              </div>
              <FormField label='Adresă' error={errors.address?.message}>
                <Input id='address' placeholder='Chișinău, str. ...' {...register('address')} />
              </FormField>
            </TabsContent>

            <TabsContent value='medical' keepMounted className='flex flex-col gap-4 pt-2'>
              <div className='sm:w-1/2'>
                <SelectField
                  control={control}
                  name='bloodType'
                  label='Grupa sanguină'
                  placeholder='Necunoscută'
                  options={BLOOD_TYPES.map((type) => ({ value: type, label: type }))}
                />
              </div>
              <FormField label='Alergii' error={errors.alergie?.message}>
                <Textarea id='alergie' placeholder='ex. penicilină, latex, anestezice' {...register('alergie')} />
              </FormField>
              <FormField label='Boli cronice' error={errors.chronicDiseases?.message}>
                <Textarea id='chronicDiseases' placeholder='ex. diabet, hipertensiune' {...register('chronicDiseases')} />
              </FormField>
              <FormField label='Medicamente curente' error={errors.currentMedications?.message}>
                <Textarea id='currentMedications' placeholder='ex. anticoagulante' {...register('currentMedications')} />
              </FormField>
              <FormField label='Note' error={errors.notes?.message}>
                <Textarea id='notes' {...register('notes')} />
              </FormField>
            </TabsContent>
          </Tabs>

          {errorMessage && (
            <p className='text-sm text-red-600'>{errorMessage}</p>
          )}
          <Button type='submit' disabled={isSubmitting} className='self-end bg-teal-500 hover:bg-teal-600 cursor-pointer'>
            {isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {success ? (
              <>Salvat<Check className='ml-2 h-4 w-4' /></>
            ) : initialData ? 'Salvează modificările' : 'Adaugă pacient'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Etichetă + câmp + mesaj de eroare - același bloc folosit pentru fiecare câmp
const FormField = ({ label, required, error, children }: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactElement<{ id?: string }>;
}) => (
  <div className='flex flex-col gap-2'>
    <Label htmlFor={children.props.id}>
      {label}{required && <span className='text-red-500'>*</span>}
    </Label>
    {children}
    {error && <p className='text-sm text-red-600'>{error}</p>}
  </div>
);

// Select legat de react-hook-form prin Controller (Select nu e un <input> obișnuit, deci nu merge cu register)
const SelectField = ({ control, name, label, placeholder, options }: {
  control: Control<PatientFormData>;
  name: 'gender' | 'category' | 'bloodType';
  label: string;
  placeholder?: string;
  options: { value: string; label: string }[];
}) => (
  <div className='flex flex-col gap-2'>
    <Label>{label}</Label>
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Select value={field.value || null} onValueChange={(value) => field.onChange(value ?? '')}>
          <SelectTrigger className='w-full cursor-pointer'>
            <SelectValue placeholder={placeholder}>
              {options.find((option) => option.value === field.value)?.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  </div>
);
