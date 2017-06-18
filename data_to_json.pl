use JSON -convert_blessed_universally;
use MyEvent;
use Player;

sub get_database {
	my $ffdb;
	my ($fname) = @_;
	open(IN, $fname);
	flock(IN, 1);
	# read in whole file
	my $tmp = $/;
	undef $/;
	my $l = <IN>;
	eval $l;
	close(IN);
	$/ = $tmp;
	return $ffdb;
}


my $fname = pop(@ARGV);

my $db = get_database($fname);
my $json = JSON->new;
$json->allow_blessed([]);
print $json->convert_blessed->pretty->encode($db);
