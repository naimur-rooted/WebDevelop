<?php
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the installation.
 * You don't have to use the website, you can copy this file to "wp-config.php"
 * and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * Database settings
 * * Secret keys
 * * Database table prefix
 * * ABSPATH
 *
 * @link https://developer.wordpress.org/advanced-administration/wordpress/wp-config/
 *
 * @package WordPress
 */

// ** Database settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define( 'DB_NAME', 'if0_41755116_wp429' );

/** Database username */
define( 'DB_USER', '41755116_3' );

/** Database password */
define( 'DB_PASSWORD', 'K1[1]1SY9p' );

/** Database hostname */
define( 'DB_HOST', 'sql110.byetcluster.com' );

/** Database charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8mb4' );

/** The database collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication unique keys and salts.
 *
 * Change these to different unique phrases! You can generate these using
 * the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}.
 *
 * You can change these at any point in time to invalidate all existing cookies.
 * This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define( 'AUTH_KEY',         'kmvp3noxr5bqpuude7a9mfqj9vdgh7cdv8ymfzrqfzkkmbeurgmiuu6rorbajpjo' );
define( 'SECURE_AUTH_KEY',  'p8tiryswbzzts7qycukcezsye07i7uyumlg6anznybfjsvukpbf3yqnsj4wpmnux' );
define( 'LOGGED_IN_KEY',    'vxbig7fp1yw7yolidfv9okjaklexdsfx2zsgydidychmyyejivfdozroy1lo3mbw' );
define( 'NONCE_KEY',        '03zxacljaastedcx2fnq7yobuid9cyh1trnyc8pstb0yakg7cd1vkcmowj50ue05' );
define( 'AUTH_SALT',        'pi7ftvvjex2ljmflxrnj5ynmqb20kniuoep7kncanzv03slft7uuswncyq1btnkd' );
define( 'SECURE_AUTH_SALT', '1rvyf8m6bzpf5ehaih7umkporuixqsomfreoiq81hobzosflalxocv11zy1mnauq' );
define( 'LOGGED_IN_SALT',   'sqyxlnvrelv4kamz3buk8curxicekhw55god1m5appvgrplnfw1vslqf6acxlxuq' );
define( 'NONCE_SALT',       'dxip3yt7g82eizryjecamw5gxxout3psnji6iumyhq5dixu0hmfy1x7ejgk2ffd9' );

/**#@-*/

/**
 * WordPress database table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 *
 * At the installation time, database tables are created with the specified prefix.
 * Changing this value after WordPress is installed will make your site think
 * it has not been installed.
 *
 * @link https://developer.wordpress.org/advanced-administration/wordpress/wp-config/#table-prefix
 */
$table_prefix = 'wp3w_';

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the documentation.
 *
 * @link https://developer.wordpress.org/advanced-administration/debug/debug-wordpress/
 */
define( 'WP_DEBUG', false );

/* Add any custom values between this line and the "stop editing" line. */



/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';
