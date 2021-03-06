import chalk from 'chalk';

export function log(
  text: string,
  type: 'info' | 'heading' | 'success' | 'error' = 'info'
) {
  if (type == 'info') {
    console.log(chalk.green(`info: ${text}`));
  } else if (type == 'heading') {
    console.log(chalk.blue(text));
  } else if (type == 'success') {
    console.log(chalk.green(`🎉 success: ${text}`));
  } else if (type == 'error') {
    console.log(chalk.red(text));
  }
}
