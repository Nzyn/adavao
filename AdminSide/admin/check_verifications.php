<?php
require_once 'vendor/autoload.php';

use Illuminate\Container\Container;
use Illuminate\Events\Dispatcher;
use Illuminate\Database\ConnectionResolver;
use Illuminate\Database\Connectors\ConnectionFactory;
use Illuminate\Database\Eloquent\Model;

// Create a service container
$container = new Container;

// Create a connection factory
$factory = new ConnectionFactory($container);

// Create a connection
$config = [
    'driver'    => 'mysql',
    'host'      => '127.0.0.1',
    'database'  => 'alertdavao',
    'username' => 'root',
    'password' => '1234',
    'charset'   => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'prefix'    => '',
];

$connection = $factory->make($config);

// Create a connection resolver
$resolver = new ConnectionResolver(['default' => $connection]);
$resolver->setDefaultConnection('default');

// Set the connection resolver on the model
Model::setConnectionResolver($resolver);

// Define the User model
class User extends Model
{
    protected $table = 'users';
    protected $primaryKey = 'id';
    public $timestamps = true;
}

// Define the Verification model
class Verification extends Model
{
    protected $table = 'verifications';
    protected $primaryKey = 'verification_id';
    public $timestamps = true;
    
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}

// Count verifications
$count = Verification::count();
echo "Number of verifications: " . $count . "\n";

// Get all verifications with user data
$verifications = Verification::with('user')->get();
foreach ($verifications as $verification) {
    echo "Verification ID: " . $verification->verification_id . "\n";
    echo "User ID: " . $verification->user_id . "\n";
    if ($verification->user) {
        echo "User Name: " . $verification->user->firstname . " " . $verification->user->lastname . "\n";
    } else {
        echo "User: Not found\n";
    }
    echo "Status: " . $verification->status . "\n";
    echo "Created At: " . $verification->created_at . "\n";
    echo "-------------------\n";
}