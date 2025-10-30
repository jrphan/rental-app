import { Component, computed, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonType = 'button' | 'submit' | 'reset';

@Component({
  selector: 'app-button',
  imports: [CommonModule],
  templateUrl: './button.component.html',
})
export class ButtonComponent {
  type = input<ButtonType>('button');
  variant = input<ButtonVariant>('primary');
  disabled = input<boolean>(false);
  loading = input<boolean>(false);

  private disabledInternal = signal(false);
  effectiveDisabled = computed(() => this.disabled() || this.disabledInternal());

  buttonClasses = computed(() => {
    const baseClasses =
      'px-6 py-3 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed w-full';

    const variantClasses = {
      primary:
        'bg-primary-500 text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
      secondary:
        'bg-secondary-600 text-white hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2',
      outline:
        'border-2 border-primary-500 text-primary-500 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
      ghost:
        'text-primary-500 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
    } as const;

    const variantClass = variantClasses[this.variant()] ?? '';
    const loadingClass = this.loading() ? ' cursor-wait opacity-75' : '';
    return `${baseClasses} ${variantClass}${loadingClass}`;
  });
}
