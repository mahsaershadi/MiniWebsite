import { CategoryFilter } from '../models';
import { FilterType } from '../models/categoryFilter';

interface ValidationError {
  field: string;
  message: string;
}

export async function validateAttributes(categoryId: number, attributes: Record<string, any>): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];
  
  //Get all filters for category
  const filters = await CategoryFilter.findAll({
    where: {
      category_id: categoryId,
      status: 1
    }
  });

  const filterMap = new Map(filters.map(filter => [filter.get('name').toLowerCase(), filter]));

  for (const filter of filters) {
    const name = filter.get('name').toLowerCase();
    const required = filter.get('required') as boolean;
    
    if (required && (!attributes[name] && !attributes[name.charAt(0).toUpperCase() + name.slice(1)])) {
      errors.push({
        field: name,
        message: `${name} is required`
      });
    }
  }

  //Validation for each attribute
  for (const [key, value] of Object.entries(attributes)) {
    const keyLower = key.toLowerCase();
    const filter = filterMap.get(keyLower);
    
    if (!filter) {
      errors.push({
        field: key,
        message: `${key} is not a valid attribute for this category`
      });
      continue;
    }

    const filterType = filter.get('type') as FilterType;
    const options = (filter.get('options') as string[] | undefined)?.map(opt => opt.toLowerCase());
    const min = filter.get('min') as number | null;
    const max = filter.get('max') as number | null;

    if (value === undefined || value === null || value === '') {
      continue;
    }

    switch (filterType) {
      case FilterType.SELECT:
        const selectValues = Array.isArray(value) ? value : [value];
        
        if (selectValues.length > 1) {
          errors.push({
            field: key,
            message: `${key} should be a single value, not multiple values`
          });
        } else if (!options?.includes(selectValues[0].toString().toLowerCase())) {
          errors.push({
            field: key,
            message: `${selectValues[0]} is not a valid option for ${key}. Valid options are: ${filter.get('options')?.join(', ')}`
          });
        }
        break;

      case FilterType.MULTISELECT:
        const multiValues = Array.isArray(value) ? value : [value];
        
        //Check if all values are in options
        const invalidValues = multiValues.filter(v => 
          !options?.includes(v.toString().toLowerCase())
        );
        
        if (invalidValues.length > 0) {
          errors.push({
            field: key,
            message: `Invalid values for ${key}: ${invalidValues.join(', ')}. Valid options are: ${filter.get('options')?.join(', ')}`
          });
        }
        break;

      case FilterType.RANGE:
        const numValue = Number(value);
        if (isNaN(numValue)) {
          errors.push({
            field: key,
            message: `${key} must be a number`
          });
        } else {
          if (min !== null && numValue < min) {
            errors.push({
              field: key,
              message: `${key} must be at least ${min}`
            });
          }
          if (max !== null && numValue > max) {
            errors.push({
              field: key,
              message: `${key} must be no more than ${max}`
            });
          }
        }
        break;

      case FilterType.BOOLEAN:
        if (typeof value !== 'boolean') {
          errors.push({
            field: key,
            message: `${key} must be a boolean value (true/false)`
          });
        }
        break;
    }
  }

  return errors;
} 