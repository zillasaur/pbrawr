#!/usr/bin/perl -w

#use lib '/home/ajshankar/lib/perl/5.8.4/';
use FCGI;
use IO::Handle;
use MyEvent;
use Player;
use Data::Dumper;
use CGI::Lite;
use DateTime;
use DateTime::Duration;

my %dispatch = (
                getData => get_data,
                newEvent => new_event,
                meToo => me_too,
                notMe => not_me,
                editEvent => edit_event,
                addEmail => add_email
                );


ql("Starting up interact.fcgi script...");

my $request = FCGI::Request();
my $CGI = new CGI::Lite;
my $data = &get_database("data");
my $events = $data->{events};
my $players = $data->{players};
my %eids;
foreach my $k (keys %{$events}) {
    next if $k eq "max_id";
    foreach my $event (@{$events->{$k}}) {
        $eids{$event->Id()} = $event;
    }
}

while($request->Accept() >= 0) {
    my $env = $request->GetEnvironment();
    print "Content-type: text/xml\n\n";
    log_request($env);
    $env->{'QUERY_STRING'} = url_decode($env->{'QUERY_STRING'});
    my $parms = $CGI->parse_new_form_data();
    my $action = $parms->{"action"};
    if (defined $action && defined $dispatch{$action}) {
        my $doit = $dispatch{$action};
        $doit->($parms);
    } else {
        print '<error>Unknown action</error>';
    }
}

sub get_data {
    my $params = shift;
    my $before = $params->{"numDaysBefore"} || 0;
    my $after = $params->{"numDaysAfter"} || 0;
#    if (! $before || ! $after) {
#        print '<error>Range incorrectly specified.</error>';
#        return;
#    }
    my $dt = DateTime->today(time_zone => 'America/Los_Angeles');

    my $startat = $dt->clone(), $endat = $dt->clone();
    $startat->subtract(days => $before);
    $endat->add(days => $after);
    my @days;
    # now, gather events for each day
    my $xml = "<success><players>";

    foreach(values %{$players}) {
        $xml .= $_->XML();
    }
    $xml .= "</players><days>\n";
    while (DateTime->compare($startat, $endat) < 1) {
        $xml .= "<day>";
        $xml .= "<year>".$startat->year()."</year>";
        $xml .= "<month>".$startat->month()."</month>";
        $xml .= "<dayofmonth>".$startat->day()."</dayofmonth>";
        $xml .= "<dayname>".$startat->day_name()."</dayname>";
        my $str = $startat->year() . $startat->doy();
        if (defined $events->{$str}) {
            my @evs = @{$events->{$str}};
            $xml .= $_->XML() foreach(@evs);
        }
        $startat->add(days => 1);
        $xml .= "</day>\n";
#        l($startat);
    }
    $xml .= "</days></success>";
    print $xml;
}

sub new_event {
    my $params = shift;
    my ($des, $day, $month, $year, $when, $where, $who) = 
        ($params->{"description"}, $params->{"day"}, $params->{"month"}, $params->{"year"}, $params->{"when"}, $params->{"where"}, $params->{"who"});
    my $dt = DateTime->new(year => $year, month => $month, day => $day);
    my $ev = new MyEvent;
    if (! defined ($players->{$who})) {
        print '<error>Person does not exist</error>';
        return;
    }
    $ev->Description($des);
    $ev->Where($where);
    $ev->AddPlayer($who);
    $ev->When($when);
    $ev->Date($dt->year . $dt->doy);
    $events->{"max_id"} = 1 if $events->{"max_id"} < 1;
    $ev->Id($events->{"max_id"}++);
    push @{$events->{$ev->Date()}}, $ev;
    $eids{$ev->Id} = $ev;
    print '<success>'.$ev->XML().'</success>';
    $request->Finish();
    &write_database("data", $players, $events);
}

sub edit_event {
    my $params = shift;
    my ($des, $when, $where, $id) = 
        ($params->{"description"}, $params->{"when"}, $params->{"where"}, int($params->{"id"}));

    if (! defined ($eids{$id})) {
        ql("event does not exist");
        print '<error>Event does not exist</error>';        
        return;
    }
    my $ev = $eids{$id};
    $ev->Description($des);
    $ev->Where($where);
    $ev->When($when);
    print '<success>'.$ev->XML().'</success>';
    $request->Finish();
    &write_database("data", $players, $events);

}

sub me_too {
    my $params = shift;
    my $eid = int($params->{"eventId"});
    my $p = $params->{"who"};

    if (! defined $eids{$eid}) {
        ql("Me too: event $eid does not exist");
        print '<error>Event does not exist</error>';
        return;
    } elsif (! defined ($players->{$p})) {
        ql("Me too: player $p does not exist");
        print '<error>Person does not exist</error>';        
        return;
    } else {
        my $e = $eids{$eid};
        $e->AddPlayer($p);
        print "<success>".$e->XML()."</success>";
        $request->Finish();
    }
    &write_database("data", $players, $events);
}

sub not_me {
    my $params = shift;
    my $eid = int($params->{"eventId"});
    my $p = $params->{"who"};
    
    if (! defined $eids{$eid}) {
        ql("could not find event $eid\n");
        print '<error>Event does not exist</error>';
        return;
    } elsif (! defined ($players->{$p})) {
        ql("could not find player $p\n");
        print '<error>Person does not exist</error>';        
        return;
    } else {
        my $e = $eids{$eid};
        $e->RemovePlayer($p);
        if (scalar $e->Who() == 0) {
            ql("removing event from dataset");
            delete $eids{$eid};
            my @res = grep { $_ ne $e } @{$events->{$e->Date()}};
            if (scalar @res) {
                $events->{$e->Date()} = \@res;
            } else { 
                delete $events->{$e->Date()};
            }
        }
        ql("result is " . $e->XML());
        print "<success>".$e->XML()."</success>";
        $request->Finish();
    }
    ql("saving to database...");
    &write_database("data", $players, $events);
}

sub add_email {
    my $params = shift;
    my $p = $params->{"who"};
    my $e = $params->{"email"};
    ql("Adding email address $e to player $p");
    if ($players->{$p} && $e ne "null" && $e ne "-") {
        $players->{$p}->Email($e);
        &write_database("data", $players, $events);
    }
}

sub log_request {
    my $e = shift;
    open(LOG, ">>interact.log");
    return unless $e->{'QUERY_STRING'};
    print LOG join("::", ($e->{'QUERY_STRING'}, $e->{'HTTP_USER_AGENT'}, $e->{'REMOTE_ADDR'}, scalar localtime(time))), "\n";
    close(LOG);
}

sub ql {
    open(LOG, ">>interact.log");
    print LOG shift;
    print LOG "\n";
    close(LOG);
}

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

sub write_database {
	my ($fname, $peeps, $evs) = @_;
  my $t = { events => $evs,
            players => $peeps
            };

	$Data::Dumper::Indent = 0;
	$Data::Dumper::Terse = 1;

	open(OUT, "+<".$fname);
	flock(OUT, 2);
	seek(OUT, 0, 0);
	truncate(OUT, 0);

	print OUT "\$ffdb = {\n";
	foreach (keys %{$t}) {
		my $esc = $_;
		$esc =~ s/'/\\'/g;
		print OUT "'$esc' => ";
		print OUT &Dumper($t->{$_});
		print OUT ",\n";
	}
	print OUT "};";
	close(OUT);
}
